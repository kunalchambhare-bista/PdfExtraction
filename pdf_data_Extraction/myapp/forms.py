from django import forms


class PdfUploadForm(forms.Form):
    pdf_file = forms.FileField(
        label='Select a PDF file',
        help_text='Only PDF files are allowed.'
    )
