from django.urls import path
from .views import FAQHandlerView
 
urlpatterns = [
    path('ask/', FAQHandlerView.as_view(), name='ask_question'),
] 