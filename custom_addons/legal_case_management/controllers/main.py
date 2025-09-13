from odoo import http
from odoo.http import request

class WelcomeController(http.Controller):

    @http.route('/', type='http', auth='public', website=True)
    def welcome(self, **kwargs):
        return http.send_file('/legal_case_management/static/description/index.html')
