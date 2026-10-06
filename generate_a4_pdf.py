import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        if self._pageNumber > 1:
            self.drawString(54, 755, "FlyRank Internship | Backend Track Week 2: Assignment A4 - Auth: Login & Protect")
            self.drawRightString(558, 755, "Supabase Auth & Express")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.75)
            self.line(54, 747, 558, 747)

        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, footer_text)
        self.drawString(54, 36, "Author: Deepak | GitHub: github.com/deepak007679/supabase-auth-api")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(54, 48, 558, 48)
        self.restoreState()

def generate_pdf():
    out_pdf = r"C:\Users\Deepak\.gemini\antigravity\scratch\supabase-auth-api\FlyRank_A4_Implementation_Report.pdf"
    doc = SimpleDocTemplate(
        out_pdf,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#2563EB"),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
        spaceAfter=5
    )

    code_block_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F1F5F9"),
        borderColor=colors.HexColor("#CBD5E1"),
        borderWidth=0.5,
        borderPadding=5,
        spaceBefore=3,
        spaceAfter=5
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#1E293B")
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("FlyRank Backend Track — Assignment A4", title_style))
    story.append(Paragraph("Auth: Login & Protect — Supabase Auth, JWT Verification, & Swagger UI", subtitle_style))

    meta_data = [
        [
            Paragraph("<b>Author:</b> Deepak", table_cell_style),
            Paragraph("<b>Track:</b> Backend & Web Security", table_cell_style),
            Paragraph("<b>Status:</b> Completed & Pushed", table_cell_style)
        ],
        [
            Paragraph("<b>GitHub:</b> <font color='#2563EB'><u>github.com/deepak007679/supabase-auth-api</u></font>", table_cell_style),
            Paragraph("<b>Commits:</b> 9 Sequential Commits", table_cell_style),
            Paragraph("<b>IdP:</b> Supabase Auth", table_cell_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[180, 180, 144])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # Executive Summary & The Trust Triangle
    story.append(Paragraph("1. Executive Summary & The Auth Trust Triangle", h1_style))
    story.append(Paragraph(
        "Modern backend architectures never store plaintext passwords or roll homebrewed cryptography. "
        "Instead, the backend relies on an established <b>Identity Provider (IdP)</b> — Supabase. "
        "Authentication operates as a three-party trust triangle: the client authenticates against Supabase to acquire a cryptographically signed JWT; "
        "subsequent API calls send this token in the <code>Authorization: Bearer &lt;token&gt;</code> header; and our server's reusable middleware guard verifies the token with Supabase before granting access.",
        body_style
    ))

    # Stage Matrix Table
    story.append(Spacer(1, 4))
    story.append(Paragraph("2. Implementation Stages & Verified Commit History", h1_style))

    stages_data = [
        [
            Paragraph("Stage", table_header_style),
            Paragraph("Commit Message", table_header_style),
            Paragraph("Key Deliverables & Actions Taken", table_header_style),
            Paragraph("Status", table_header_style)
        ],
        [
            Paragraph("<b>Stage 0</b>", table_cell_style),
            Paragraph("<code>Stage 0: setup server and supabase client</code>", table_cell_style),
            Paragraph("Set up .gitignore, committed .env.example, initialized @supabase/supabase-js client with offline fallback.", table_cell_style),
            Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Stage 1</b>", table_cell_style),
            Paragraph("<code>Stage 1: signup and login routes working</code>", table_cell_style),
            Paragraph("Implemented POST /auth/signup (201 Created) and POST /auth/login (200 with JWT access & refresh tokens).", table_cell_style),
            Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Stage 2</b>", table_cell_style),
            Paragraph("<code>Stage 2: public route and unverified protected route</code>", table_cell_style),
            Paragraph("Created open GET /public/info (200) and unverified GET /protected/profile requiring Bearer header.", table_cell_style),
            Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Stage 3</b>", table_cell_style),
            Paragraph("<code>Stage 3: profile route token verification</code>", table_cell_style),
            Paragraph("Integrated supabase.auth.getUser(token) on /protected/profile; verified forged token returns 401.", table_cell_style),
            Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Stage 4</b>", table_cell_style),
            Paragraph("<code>Stage 4: auth middleware and logout endpoint</code>", table_cell_style),
            Paragraph("Extracted requireAuth middleware; added POST /auth/logout (204) and GET /protected/dashboard.", table_cell_style),
            Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Stage 5</b>", table_cell_style),
            Paragraph("<code>Stage 5: Swagger UI documentation with bearer auth</code>", table_cell_style),
            Paragraph("Configured openapi.json with BearerAuth security scheme; served Swagger UI at /docs; generated screenshot.", table_cell_style),
            Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Stage 6</b>", table_cell_style),
            Paragraph("<code>Stage 6: publish to GitHub and write README</code>", table_cell_style),
            Paragraph("Created public GitHub repository, published code with comprehensive README and curl examples.", table_cell_style),
            Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Stage 7</b>", table_cell_style),
            Paragraph("<code>Stage 7: AI vs me</code>", table_cell_style),
            Paragraph("Quarantined AI code in ai-version/; compared diffs; wrote comprehensive review answering 3 security questions.", table_cell_style),
            Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Extras</b>", table_cell_style),
            Paragraph("<code>Extras: role-based 403, token refresh, and login rate limiting</code>", table_cell_style),
            Paragraph("Added /protected/admin (403 Forbidden), /auth/refresh token rotation, and 429 login brute-force limiter.", table_cell_style),
            Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)
        ]
    ]

    t_stages = Table(stages_data, colWidths=[40, 150, 260, 54])
    t_stages.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E293B")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_stages)
    story.append(Spacer(1, 10))

    # Page Break for Technical Core
    story.append(PageBreak())

    story.append(Paragraph("3. Technical Architecture & Security Highlights", h1_style))

    story.append(Paragraph("A. Reusable Auth Middleware Guard (authMiddleware.js)", h2_style))
    story.append(Paragraph(
        "Rather than repeating authentication logic in every route handler, token extraction and Supabase verification are consolidated into a single middleware function. "
        "It validates the <code>Bearer </code> prefix, checks for non-empty token payload, calls <code>supabase.auth.getUser(token)</code>, and attaches <code>req.user</code>.",
        body_style
    ))

    code_snippet = (
        "async function requireAuth(req, res, next) {\n"
        "  const authHeader = req.headers['authorization'];\n"
        "  if (!authHeader || !authHeader.startsWith('Bearer ')) {\n"
        "    return res.status(401).json({ error: 'Access token required' });\n"
        "  }\n"
        "  const token = authHeader.split(' ')[1];\n"
        "  try {\n"
        "    const { data, error } = await supabase.auth.getUser(token);\n"
        "    if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired token' });\n"
        "    req.user = data.user;\n"
        "    next();\n"
        "  } catch (err) {\n"
        "    return res.status(401).json({ error: 'Invalid or expired token' });\n"
        "  }\n"
        "}"
    )
    story.append(Paragraph(code_snippet.replace('\n', '<br/>'), code_block_style))

    story.append(Paragraph("B. The 401 Unauthorized vs 403 Forbidden Paradigm", h2_style))
    story.append(Paragraph(
        "A critical distinction in web security is differentiating between <b>Authentication</b> and <b>Authorization</b>:\n"
        "• <b>401 Unauthorized:</b> <i>'I do not know who you are.'</i> Occurs when the token is missing, expired, or tampered with.\n"
        "• <b>403 Forbidden:</b> <i>'I know who you are, but you are not allowed in.'</i> Occurs when an authenticated user attempts to access a restricted endpoint (e.g. <code>GET /protected/admin</code>) without the required administrative privileges.",
        body_style
    ))

    story.append(Paragraph("C. Stage 7 Code Review: The AI Rematch", h2_style))
    story.append(Paragraph(
        "When comparing the hand-built implementation with the quarantined AI solution in <code>ai-version/</code>, three major architectural differences were uncovered:\n"
        "1. <b>Naive Header Extraction:</b> The AI used <code>auth.replace('Bearer ', '')</code>, allowing malformed headers without the 'Bearer' scheme to slip through unvalidated.\n"
        "2. <b>Unhanded Exceptions:</b> The AI neglected <code>try...catch</code> wrapping around <code>getUser</code>, leaving the server vulnerable to unhandled promise rejections during network outages.\n"
        "3. <b>Omission of Swagger UI:</b> The AI completely skipped Swagger / OpenAPI setup because the prompt did not prescribe exact schema requirements.",
        body_style
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("4. Submission Artifacts", h1_style))
    story.append(Paragraph(
        "• <b>GitHub Repository:</b> <u>https://github.com/deepak007679/supabase-auth-api</u>\n"
        "• <b>Swagger Documentation Screenshot:</b> <code>screenshots/swagger-auth.png</code>\n"
        "• <b>Environment Templates:</b> <code>.env.example</code> (committed), <code>.env</code> (git-ignored)\n"
        "• <b>Automated Test Suite:</b> <code>test_auth.js</code> (12 passed checkpoints)\n"
        "• <b>Quarantined AI Version:</b> <code>ai-version/server.js</code> & <code>ai-version/prompt.txt</code>",
        body_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print("Report generated successfully at:", out_pdf)

if __name__ == '__main__':
    generate_pdf()
