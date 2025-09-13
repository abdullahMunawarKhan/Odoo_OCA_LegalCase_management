from odoo import fields, models


class ResPartner(models.Model):
    _inherit = 'res.partner'

    is_lawyer = fields.Boolean(string='Is a Lawyer', default=False)
    is_client = fields.Boolean(string='Is a Client', default=False)
    bar_number = fields.Char(string='Bar Number')
    
    # Smart buttons for lawyers
    case_count = fields.Integer(
        string='Cases',
        compute='_compute_case_count'
    )
    hearing_count = fields.Integer(
        string='Hearings',
        compute='_compute_hearing_count'
    )

    def _compute_case_count(self):
        for partner in self:
            if partner.is_lawyer:
                partner.case_count = self.env['legal.case'].search_count([
                    ('responsible_lawyer_id', '=', partner.id)
                ])
            elif partner.is_client:
                partner.case_count = self.env['legal.case'].search_count([
                    ('client_id', '=', partner.id)
                ])
            else:
                partner.case_count = 0

    def _compute_hearing_count(self):
        for partner in self:
            if partner.is_lawyer:
                partner.hearing_count = self.env['legal.hearing'].search_count([
                    ('responsible_lawyer_id', '=', partner.id)
                ])
            elif partner.is_client:
                partner.hearing_count = self.env['legal.hearing'].search_count([
                    ('client_id', '=', partner.id)
                ])
            else:
                partner.hearing_count = 0

    def action_view_cases(self):
        if self.is_lawyer:
            domain = [('responsible_lawyer_id', '=', self.id)]
        elif self.is_client:
            domain = [('client_id', '=', self.id)]
        else:
            domain = []
            
        return {
            'name': 'Cases',
            'type': 'ir.actions.act_window',
            'res_model': 'legal.case',
            'view_mode': 'tree,form,kanban',
            'domain': domain,
        }

    def action_view_hearings(self):
        if self.is_lawyer:
            domain = [('responsible_lawyer_id', '=', self.id)]
        elif self.is_client:
            domain = [('client_id', '=', self.id)]
        else:
            domain = []
            
        return {
            'name': 'Hearings',
            'type': 'ir.actions.act_window',
            'res_model': 'legal.hearing',
            'view_mode': 'tree,form,calendar',
            'domain': domain,
        }
