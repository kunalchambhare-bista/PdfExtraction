# myapp/views.py
from .forms import PdfUploadForm

from django.http import HttpResponse
from django.shortcuts import render
from django.http import JsonResponse
from datetime import date, datetime



def homepage(request):
    return render(request, 'homepage.html')


from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient


def _azure_doc_connector():
    azure_end_point = 'https://standard-rpa-automation.cognitiveservices.azure.com/'
    azure_key = 'ec8d2e873a3e4be9a5a374de2aaf279b'
    if azure_end_point and azure_key:
        return DocumentAnalysisClient(endpoint=azure_end_point,
                                      credential=AzureKeyCredential(azure_key))
    else:
        raise Exception("Azure end point or key not set")


def _azure_doc_parser(result):
    final_result = {}
    for idx, document in enumerate(result.documents):
        for name, field in document.fields.items():
            field_value = field.value if field.value else field.content
            if isinstance(field_value, (str, date, datetime)) or name == 'Items':
                final_result.update({
                    name: field_value
                })
            else:
                final_result.update({
                    name: field_value.to_dict()
                })

    item = []

    if final_result.get('Items'):
        for index, data in enumerate(final_result.get('Items')):
            item_dict = {}
            vals = data.to_dict().get('value')
            for key, value in vals.items():
                item_dict.update({
                    key: value.get('value')
                })
            item.append(item_dict)
    if len(item):
        del final_result['Items']
        final_result.update({
            'Line Items': item
        })

    return final_result


def process_pdf(request):
    if request.method == 'POST':
        form = PdfUploadForm(request.POST, request.FILES)
        if form.is_valid():
            pdf_file = form.cleaned_data['pdf_file']

            try:

                azure_comm = _azure_doc_connector()
                with pdf_file.file as f:
                    poller = azure_comm.begin_analyze_document(
                        model_id='prebuilt-invoice', document=f.read())
                    result = poller.result()
                    final_result = _azure_doc_parser(result)
                    return JsonResponse({'Form Recognizer Result': final_result}, json_dumps_params={'indent': 2})
            except Exception as e:
                return HttpResponse(f"Error processing PDF: {str(e)}")
    else:
        form = PdfUploadForm()

    return render(request, 'pdf_upload.html', {'form': form})


def process_pdf_react(request):
    return render(request, 'pdf_extract.html')


def extract_pdf(request):
    print(request)
    if request.method == 'POST' and request.FILES.get('pdf_file'):
        pdf_file = request.FILES['pdf_file']

        try:
            azure_comm = _azure_doc_connector()
            with pdf_file.file as f:
                poller = azure_comm.begin_analyze_document(
                    model_id='prebuilt-invoice', document=f.read())
                result = poller.result()
                final_result = _azure_doc_parser(result)
                return JsonResponse({'Form Recognizer Result': final_result}, json_dumps_params={'indent': 2})
        except Exception as e:
            print(e)
            return JsonResponse({'error': f"Error processing PDF: {str(e)}"}, status=500)
    else:
        return HttpResponse("Invalid request", status=400)
