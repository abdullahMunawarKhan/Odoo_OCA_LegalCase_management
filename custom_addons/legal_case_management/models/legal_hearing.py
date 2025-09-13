from odoo import api, fields, models, _


class LegalHearing(models.Model):
    _name = 'legal.hearing'
    _description = 'Legal Hearing'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'date_start desc'

    name = fields.Char(string='Hearing Name', required=True, tracking=True)
    case_id = fields.Many2one(
        'legal.case',
        string='Case',
        required=True,
        ondelete='cascade',
        tracking=True
    )
    date_start = fields.Datetime(
        string='Start Date',
        required=True,
        tracking=True
    )
    date_end = fields.Datetime(
        string='End Date',
        required=True,
        tracking=True
    )
    location = fields.Char(string='Location', tracking=True)
    status = fields.Selection([
        ('planned', 'Planned'),
        ('held', 'Held'),
        ('adjourned', 'Adjourned'),
        ('cancelled', 'Cancelled'),
    ], string='Status', default='planned', required=True, tracking=True)
    
    notes = fields.Text(string='Notes')
    
    # Related fields for easy access
    client_id = fields.Many2one(related='case_id.client_id', string='Client', store=True)
    responsible_lawyer_id = fields.Many2one(
        related='case_id.responsible_lawyer_id',
        string='Responsible Lawyer',
        store=True
    )

    @api.constrains('date_start', 'date_end')
    def _check_dates(self):
        for hearing in self:
            if hearing.date_start >= hearing.date_end:
                raise models.ValidationError(
                    _('The start date must be before the end date.')
                )
