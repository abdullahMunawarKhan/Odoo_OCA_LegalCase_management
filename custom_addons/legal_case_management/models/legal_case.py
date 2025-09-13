from odoo import api, fields, models, _
from odoo.exceptions import UserError


class LegalCase(models.Model):
    _name = 'legal.case'
    _description = 'Legal Case'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'name desc'
    _rec_name = 'name'

    name = fields.Char(
        string='Case Reference',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('New'),
        tracking=True
    )
    client_id = fields.Many2one(
        'res.partner',
        string='Client',
        required=True,
        domain=[('is_client', '=', True)],
        tracking=True
    )
    responsible_lawyer_id = fields.Many2one(
        'res.partner',
        string='Responsible Lawyer',
        required=True,
        domain=[('is_lawyer', '=', True)],
        tracking=True
    )
    member_ids = fields.Many2many(
        'res.users',
        'legal_case_user_rel',
        'case_id',
        'user_id',
        string='Team Members'
    )
    case_type = fields.Selection([
        ('civil', 'Civil'),
        ('criminal', 'Criminal'),
        ('family', 'Family'),
        ('corporate', 'Corporate'),
        ('property', 'Property'),
        ('other', 'Other'),
    ], string='Case Type', required=True, default='civil', tracking=True)
    
    stage = fields.Selection([
        ('intake', 'Intake'),
        ('active', 'Active'),
        ('closed', 'Closed'),
    ], string='Stage', required=True, default='intake', tracking=True)
    
    open_date = fields.Date(
        string='Open Date',
        default=fields.Date.today,
        required=True
    )
    close_date = fields.Date(string='Close Date', readonly=True)
    description = fields.Text(string='Description')
    
    # Smart buttons
    hearing_count = fields.Integer(
        string='Hearings',
        compute='_compute_hearing_count'
    )
    invoice_count = fields.Integer(
        string='Invoices',
        compute='_compute_invoice_count'
    )
    attachment_count = fields.Integer(
        string='Documents',
        compute='_compute_attachment_count'
    )
    
    # Invoicing
    fixed_fee_amount = fields.Monetary(
        string='Fixed Fee Amount',
        currency_field='currency_id'
    )
    currency_id = fields.Many2one(
        'res.currency',
        string='Currency',
        default=lambda self: self.env.company.currency_id
    )
    
    # Related fields
    hearing_ids = fields.One2many(
        'legal.hearing',
        'case_id',
        string='Hearings'
    )
    next_hearing_date = fields.Datetime(
        string='Next Hearing',
        compute='_compute_next_hearing_date',
        store=True
    )

    @api.model
    def create(self, vals):
        if vals.get('name', _('New')) == _('New'):
            vals['name'] = self.env['ir.sequence'].next_by_code('legal.case') or _('New')
        result = super().create(vals)
        return result

    def write(self, vals):
        if vals.get('stage') == 'closed' and not self.close_date:
            vals['close_date'] = fields.Date.today()
        return super().write(vals)

    @api.depends('hearing_ids')
    def _compute_hearing_count(self):
        for case in self:
            case.hearing_count = len(case.hearing_ids)

    @api.depends('hearing_ids.date_start')
    def _compute_next_hearing_date(self):
        for case in self:
            future_hearings = case.hearing_ids.filtered(
                lambda h: h.date_start > fields.Datetime.now() and h.status == 'planned'
            )
            case.next_hearing_date = min(future_hearings.mapped('date_start'), default=False)

    def _compute_invoice_count(self):
        for case in self:
            invoices = self.env['account.move'].search([
                ('legal_case_id', '=', case.id),
                ('move_type', '=', 'out_invoice')
            ])
            case.invoice_count = len(invoices)

    def _compute_attachment_count(self):
        for case in self:
            case.attachment_count = self.env['ir.attachment'].search_count([
                ('res_model', '=', 'legal.case'),
                ('res_id', '=', case.id)
            ])

    def action_view_hearings(self):
        return {
            'name': _('Hearings'),
            'type': 'ir.actions.act_window',
            'res_model': 'legal.hearing',
            'view_mode': 'tree,form,calendar',
            'domain': [('case_id', '=', self.id)],
            'context': {'default_case_id': self.id},
        }

    def action_view_invoices(self):
        return {
            'name': _('Invoices'),
            'type': 'ir.actions.act_window',
            'res_model': 'account.move',
            'view_mode': 'tree,form',
            'domain': [('legal_case_id', '=', self.id), ('move_type', '=', 'out_invoice')],
        }

    def action_view_attachments(self):
        return {
            'name': _('Documents'),
            'type': 'ir.actions.act_window',
            'res_model': 'ir.attachment',
            'view_mode': 'tree,form',
            'domain': [('res_model', '=', 'legal.case'), ('res_id', '=', self.id)],
            'context': {'default_res_model': 'legal.case', 'default_res_id': self.id},
        }

    def action_create_invoice(self):
        """Create a fixed fee invoice for this case"""
        if not self.fixed_fee_amount:
            raise UserError(_('Please set a fixed fee amount before creating an invoice.'))
        
        # Check if invoice already exists
        existing_invoice = self.env['account.move'].search([
            ('legal_case_id', '=', self.id),
            ('move_type', '=', 'out_invoice'),
            ('state', '=', 'draft')
        ], limit=1)
        
        if existing_invoice:
            return {
                'name': _('Invoice'),
                'type': 'ir.actions.act_window',
                'res_model': 'account.move',
                'res_id': existing_invoice.id,
                'view_mode': 'form',
            }

        # Create legal services product if not exists
        product = self.env['product.product'].search([('default_code', '=', 'LEGAL_SERVICE')], limit=1)
        if not product:
            product = self.env['product.product'].create({
                'name': 'Legal Services',
                'default_code': 'LEGAL_SERVICE',
                'type': 'service',
                'invoice_policy': 'order',
            })

        invoice_vals = {
            'move_type': 'out_invoice',
            'partner_id': self.client_id.id,
            'legal_case_id': self.id,
            'invoice_line_ids': [(0, 0, {
                'product_id': product.id,
                'name': f'Legal Services - {self.name}',
                'quantity': 1,
                'price_unit': self.fixed_fee_amount,
            })],
        }

        invoice = self.env['account.move'].create(invoice_vals)
        
        return {
            'name': _('Invoice'),
            'type': 'ir.actions.act_window',
            'res_model': 'account.move',
            'res_id': invoice.id,
            'view_mode': 'form',
        }


# Extend account.move to add case reference
class AccountMove(models.Model):
    _inherit = 'account.move'
    
    legal_case_id = fields.Many2one('legal.case', string='Legal Case')
