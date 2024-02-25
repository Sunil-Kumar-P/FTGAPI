from django.urls import path
from .views import person_list, person_detail

urlpatterns = [
    path('persons/', person_list, name='person_list'),
    path('persons/<int:pk>/', person_detail, name='person_detail'),
]
