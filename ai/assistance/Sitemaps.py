from django.contrib.sitemaps import Sitemap
from .models import Brand, Product, Category  # Importez vos modèles

class ProductSitemap(Sitemap):
    changefreq = "weekly"  # Fréquence de mise à jour suggérée
    priority = 0.8         # Priorité pour ce type de contenu

    def items(self):
        return Product.objects.all()  # Retourne tous les produits

    def location(self, obj):
        return f'/product/{obj.slug}/'  # URL pour chaque produit

    def lastmod(self, obj):
        return obj.updated


class CategorySitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return Category.objects.all()  # Retourne toutes les catégories

    def location(self, obj):
        return f'/category/{obj.slug}/'

    def lastmod(self, obj):
        return obj.updated

class BrandSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return Brand.objects.all()  # Retourne toutes les catégories

    def location(self, obj):
        return f'/brand/{obj.slug}/'

    def lastmod(self, obj):
        return obj.updated

class StaticSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.5

    
    def items(self):
        # Les routes Angular à inclure dans le sitemap
        return [
            'home', 'register', 'settings', 'product', 'categories', 
            'brand', 'color', 'size', 'length', 'attribut', 'address', 
            'liste', 'cart', 'robot'
        ]

    def location(self, item):
        # Générer les URLs correspondantes en fonction des routes Angular
        angular_urls = {
            'home': '/',
            'register': '/register',
            'settings': '/settings',
            'product': '/product',
            'categories': '/categories',
            'brand': '/brand',
            'color': '/color',
            'size': '/size',
            'length': '/length',
            'attribut': '/attribut',
            'address': '/address',
            'liste': '/liste',
            'cart': '/cart',
            'robot':'/py/robots.txt'
        }
        return angular_urls[item]
