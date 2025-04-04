"""
URL configuration for ai project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from assistance.Sitemaps import StaticSitemap, ProductSitemap
from assistance.views import RobotsTextView
from django.contrib.sitemaps.views import sitemap
from django.conf.urls.static import static
from django.conf import settings

sitemaps={
    'product':ProductSitemap,
    'static':StaticSitemap
}

urlpatterns = [
    path('py/admin/', admin.site.urls),
    path('py/assistance/',include(('assistance.urls','assistance'),namespace='assistance')),
    path('py/sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='sitemap.xml'),
    path("py/robots.txt", RobotsTextView.as_view(), name="robots_file"),
]
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
