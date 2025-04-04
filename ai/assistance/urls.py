from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='chat'),
    path('process_image/', views.process_image, name='process_image'),
]
