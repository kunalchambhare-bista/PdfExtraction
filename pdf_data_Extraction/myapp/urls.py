# myapp/urls.py
from django.urls import path
from .views import homepage, process_pdf, process_pdf_react, extract_pdf

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', homepage, name='homepage'),
    path('process_pdf/', process_pdf, name='process_pdf'),
    path('extract_pdf/', process_pdf_react, name='process_pdf_react'),
    path('do_extract/', extract_pdf, name='extract_pdf'),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
