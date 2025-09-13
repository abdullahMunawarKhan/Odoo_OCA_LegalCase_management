from odoo.tests import TransactionCase
from odoo.exceptions import UserError
from datetime import datetime, timedelta


class TestLegalCase(TransactionCase):

    def setUp(self):
        super().setUp()
        # Create test lawyer and client
        self.lawyer = self.env['res.partner'].create({
            'name': 'Test Lawyer',
            'is_lawyer': True,
            'email': 'test.lawyer@example.com',
        })
        
        self.client = self.env['res.partner'].create({
            'name': 'Test Client',
            'is_client': True,
            'email': 'test.client@example.com',
        })

    def test_case_creation(self):
        """Test legal case creation"""
        case = self.env['legal.case'].create({
            'client_id': self.client.id,
            'responsible_lawyer_id': self.lawyer.id,
            'case_type': 'civil',
            'description': 'Test case description',
            'fixed_fee_amount': 1000.0,
        })
        
        # Check that case was created with sequence
        self.assertTrue(case.name)
        self.assertNotEqual(case.name, 'New')
        self.assertTrue(case.name.startswith('CASE/'))
        
        # Check default values
        self.assertEqual(case.stage, 'intake')
        self.assertEqual(case.open_date, case.env.context.get('today', case._fields['open_date'].today()))

    def test_case_stage_flow(self):
        """Test case stage transitions"""
        case = self.env['legal.case'].create({
            'client_id': self.client.id,
            'responsible_lawyer_id': self.lawyer.id,
            'case_type': 'civil',
        })
        
        # Test initial stage
        self.assertEqual(case.stage, 'intake')
        self.assertFalse(case.close_date)
        
        # Move to active
        case.stage = 'active'
        self.assertFalse(case.close_date)
        
        # Close case
        case.stage = 'closed'
        self.assertTrue(case.close_date)

    def test_hearing_creation(self):
        """Test hearing creation and relationship"""
        case = self.env['legal.case'].create({
            'client_id': self.client.id,
            'responsible_lawyer_id': self.lawyer.id,
            'case_type': 'civil',
        })
        
        hearing_date = datetime.now() + timedelta(days=7)
        hearing = self.env['legal.hearing'].create({
            'name': 'Test Hearing',
            'case_id': case.id,
            'date_start': hearing_date,
            'date_end': hearing_date + timedelta(hours=2),
            'location': 'Court Room 1',
        })
        
        # Check hearing creation and defaults
        self.assertEqual(hearing.case_id, case)
        self.assertEqual(hearing.status, 'planned')
        self.assertEqual(hearing.client_id, self.client)
        self.assertEqual(hearing.responsible_lawyer_id, self.lawyer)
        
        # Check case hearing count
        self.assertEqual(case.hearing_count, 1)

    def test_next_hearing_computation(self):
        """Test next hearing date computation"""
        case = self.env['legal.case'].create({
            'client_id': self.client.id,
            'responsible_lawyer_id': self.lawyer.id,
            'case_type': 'civil',
        })
        
        # Create past hearing
        past_date = datetime.now() - timedelta(days=1)
        self.env['legal.hearing'].create({
            'name': 'Past Hearing',
            'case_id': case.id,
            'date_start': past_date,
            'date_end': past_date + timedelta(hours=1),
            'location': 'Court Room 1',
            'status': 'held',
        })
        
        # Create future hearing
        future_date = datetime.now() + timedelta(days=7)
        self.env['legal.hearing'].create({
            'name': 'Future Hearing',
            'case_id': case.id,
            'date_start': future_date,
            'date_end': future_date + timedelta(hours=2),
            'location': 'Court Room 2',
            'status': 'planned',
        })
        
        # Check next hearing computation
        case._compute_next_hearing_date()
        self.assertEqual(case.next_hearing_date, future_date)

    def test_invoice_creation(self):
        """Test invoice creation for fixed fee"""
        case = self.env['legal.case'].create({
            'client_id': self.client.id,
            'responsible_lawyer_id': self.lawyer.id,
            'case_type': 'civil',
            'fixed_fee_amount': 2000.0,
        })
        
        # Test invoice creation
        action = case.action_create_invoice()
        self.assertEqual(action['res_model'], 'account.move')
        
        # Check invoice was created
        invoice = self.env['account.move'].browse(action['res_id'])
        self.assertEqual(invoice.partner_id, self.client)
        self.assertEqual(invoice.legal_case_id, case)
        self.assertEqual(invoice.move_type, 'out_invoice')
        self.assertEqual(len(invoice.invoice_line_ids), 1)
        self.assertEqual(invoice.invoice_line_ids.price_unit, 2000.0)

    def test_invoice_creation_without_amount(self):
        """Test invoice creation fails without fixed fee amount"""
        case = self.env['legal.case'].create({
            'client_id': self.client.id,
            'responsible_lawyer_id': self.lawyer.id,
            'case_type': 'civil',
            'fixed_fee_amount': 0,
        })
        
        with self.assertRaises(UserError):
            case.action_create_invoice()

    def test_attachment_count(self):
        """Test document attachment count"""
        case = self.env['legal.case'].create({
            'client_id': self.client.id,
            'responsible_lawyer_id': self.lawyer.id,
            'case_type': 'civil',
        })
        
        # Create attachment
        self.env['ir.attachment'].create({
            'name': 'Test Document.pdf',
            'res_model': 'legal.case',
            'res_id': case.id,
            'datas': b'Test file content',
        })
        
        # Check attachment count
        case._compute_attachment_count()
        self.assertEqual(case.attachment_count, 1)

    def test_partner_flags(self):
        """Test partner lawyer/client flags and counts"""
        # Test lawyer
        self.assertTrue(self.lawyer.is_lawyer)
        self.assertFalse(self.lawyer.is_client)
        
        # Test client
        self.assertTrue(self.client.is_client)
        self.assertFalse(self.client.is_lawyer)
        
        # Create case and test counts
        case = self.env['legal.case'].create({
            'client_id': self.client.id,
            'responsible_lawyer_id': self.lawyer.id,
            'case_type': 'civil',
        })
        
        self.lawyer._compute_case_count()
        self.client._compute_case_count()
        
        self.assertEqual(self.lawyer.case_count, 1)
        self.assertEqual(self.client.case_count, 1)
