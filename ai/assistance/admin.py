from django.contrib import admin
from .models import AppUser, Brand, CartOrderItems, Category, Color, ContactForms, Length, Orders, Product, ProductAttribute, ShopAddresses, Size

# Enregistrer vos modèles dans l'admin
admin.site.register(AppUser)
admin.site.register(ContactForms)
admin.site.register(Length)
admin.site.register(Size)


class BrandAdmin(admin.ModelAdmin):
	list_display=('title','image_tag')
	prepopulated_fields = {"slug": ("title",)}
admin.site.register(Brand,BrandAdmin)

class CategoryAdmin(admin.ModelAdmin):
	list_display=('title','image_tag')
	prepopulated_fields = {"slug": ("title",)}
admin.site.register(Category,CategoryAdmin)

class ProductAdmin(admin.ModelAdmin):
	list_display=('id','title','category','brand','status','is_featured', 'user')
	list_editable=('status','is_featured')
	prepopulated_fields = {"slug": ("title",)}
admin.site.register(Product,ProductAdmin)


class CartOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'order__order_status', 'order__paid_status', 'total_amt', 'order__user')

admin.site.register(CartOrderItems, CartOrderItemAdmin)

class CartOrderAdmin(admin.ModelAdmin):
    list_display = ('created', 'order_id', 'order_status', 'paid_status', 'total_amt', 'user')

admin.site.register(Orders, CartOrderAdmin)
class ProductAttributeAdmin(admin.ModelAdmin):
	list_display=('image_tag','product','price','color','size', 'length','qte','sales')
	list_editable=('qte',)
admin.site.register(ProductAttribute,ProductAttributeAdmin)



class ColorAdmin(admin.ModelAdmin):
	list_display=('title','color_bg')
admin.site.register(Color,ColorAdmin)

class ShopAddressesAdmin(admin.ModelAdmin):
    list_display=('user','status','address','country','added')
admin.site.register(ShopAddresses,ShopAddressesAdmin)
