{
    'name': 'Legal Case Management',
    'version': '18.0.1.0.0',
    'license': 'AGPL-3',
    'summary': 'Minimal Legal Case Management for Law Firms',
    'description': """
Legal Case Management System
============================

A minimal app to create clients/lawyers, register cases, plan hearings, 
attach documents, and issue fixed-fee invoices.

Key Features:
* Create Lawyers and Clients (as res.partner flags)
* Register Cases with unique reference and lifecycle
* Plan Hearings/Sittings on calendar
* Attach Documents to cases
* Fixed-fee invoicing
* Simple reports and case summary PDF

This module follows OCA standards and best practices.
    """,
    'author': 'Your Company Name, Odoo Community Association (OCA)',
    'website': 'https://github.com/OCA/legal',
    'category': 'Services/Legal',
    'sequence': 10,
    'depends': [
        'base',
        'mail',
        'account',
        'calendar',
        'contacts',
        'board',
    ],
    'data': [
        # Security
        'security/groups.xml',
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        
        # Data
        'data/sequences.xml',
        
        # Views
        'views/res_partner_views.xml',
        'views/legal_case_views.xml',
        'views/legal_hearing_views.xml',
        'views/legal_dashboard_views.xml',
        'views/menu_views.xml',
        
        # Reports
        'report/case_summary_report.xml',
        'report/case_summary_template.xml',
    ],
    'assets': {
    'web.assets_frontend': [
        'legal_case_management/static/description/*',
    ],
},
    'demo': [
        'demo/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,


}

