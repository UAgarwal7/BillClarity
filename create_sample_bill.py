from weasyprint import HTML

html_content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
        }
        .provider-info {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .provider-address {
            font-size: 12px;
            color: #666;
        }
        .patient-info {
            background-color: #f5f5f5;
            padding: 10px;
            margin: 20px 0;
            font-size: 12px;
        }
        .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-top: 15px;
            margin-bottom: 5px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
        }
        th {
            background-color: #f0f0f0;
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #999;
            font-weight: bold;
        }
        td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        .amount {
            text-align: right;
        }
        .total-section {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #333;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 12px;
        }
        .total-amount {
            font-weight: bold;
            font-size: 14px;
        }
        .error-flag {
            color: red;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="provider-info">MainCare Urgent Care & Clinic</div>
        <div class="provider-address">1250 Medical Plaza Drive, Suite 200 | Springfield, IL 62701</div>
        <div class="provider-address">Phone: (217) 555-0147 | Fax: (217) 555-0148</div>
    </div>

    <div class="patient-info">
        <strong>PATIENT STATEMENT</strong><br>
        <strong>Patient Name:</strong> John Michael Thompson<br>
        <strong>Patient ID:</strong> 1847562<br>
        <strong>Date of Service:</strong> January 15, 2025<br>
        <strong>Insurance:</strong> Blue Cross Blue Shield<br>
        <strong>Statement Date:</strong> January 20, 2025
    </div>

    <div class="section-title">ITEMIZED CHARGES</div>
    <table>
        <thead>
            <tr>
                <th>Service Description</th>
                <th>CPT Code</th>
                <th>Units</th>
                <th class="amount">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Office Visit - Established Patient, Low Complexity</td>
                <td>99213</td>
                <td>1</td>
                <td class="amount">$125.00</td>
            </tr>
            <tr>
                <td>Problem-Focused History & Exam</td>
                <td>99212</td>
                <td>1</td>
                <td class="amount">$85.00</td>
            </tr>
            <tr>
                <td>Rapid Strep Test</td>
                <td>87880</td>
                <td>1</td>
                <td class="amount">$45.00</td>
            </tr>
            <tr>
                <td>Throat Culture</td>
                <td>87081</td>
                <td>1</td>
                <td class="amount">$35.00</td>
            </tr>
            <tr style="background-color: #ffe6e6;">
                <td><span class="error-flag">DUPLICATE:</span> Office Visit - Established Patient, Low Complexity</td>
                <td>99213</td>
                <td>1</td>
                <td class="amount">$125.00</td>
            </tr>
            <tr>
                <td>Penicillin V Potassium 500mg, 20 tablets</td>
                <td>J3285</td>
                <td>1</td>
                <td class="amount">$22.50</td>
            </tr>
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span class="amount">$437.50</span>
        </div>
        <div class="total-row">
            <span>Insurance Adjustment:</span>
            <span class="amount">-$150.00</span>
        </div>
        <div class="total-row">
            <span>Patient Balance:</span>
            <span class="amount total-amount">$287.50</span>
        </div>
    </div>

    <div style="margin-top: 30px; font-size: 11px; color: #666;">
        <p><strong>Questions about your bill?</strong> Contact our billing department at (217) 555-0150 or billing@maincareuc.com</p>
        <p>Payment is due within 30 days of receipt. Please include your patient ID with your payment.</p>
    </div>
</body>
</html>
"""

HTML(string=html_content).write_pdf('simple_error.pdf')
print("✓ Created simple_error.pdf")
