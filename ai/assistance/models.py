# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.utils.html import mark_safe
from django.contrib.sites.models import Site


class AppUser(models.Model):
    id = models.BigAutoField(primary_key=True)
    password = models.CharField(max_length=255, blank=True, null=True)
    username = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'app_user'

    def __str__(self):
        return self.username


class Brand(models.Model):
    id = models.BigAutoField(primary_key=True)
    created = models.DateTimeField()
    image_path = models.CharField(max_length=255)
    slug = models.TextField()
    specs = models.TextField(blank=True, null=True)
    title = models.TextField()
    updated = models.DateTimeField()

    def image_tag(self):
        current_site = Site.objects.get_current()
        return mark_safe(f'<img src="https://{current_site.domain}/api/images/{self.image_path}" width="100" />')

    def __str__(self):
        return self.title
    class Meta:
        managed = False
        db_table = 'brand'


class CartOrderItems(models.Model):
    id = models.BigAutoField(primary_key=True)
    attribute = models.CharField(max_length=255, blank=True, null=True)
    created = models.DateTimeField()
    image_path = models.CharField(max_length=255, blank=True, null=True)
    item = models.CharField(max_length=400, blank=True, null=True)
    price = models.DecimalField(max_digits=38, decimal_places=2)
    quantity = models.BigIntegerField(blank=True, null=True)
    total_amt = models.DecimalField(max_digits=38, decimal_places=2)
    order = models.ForeignKey('Orders', models.DO_NOTHING)

    def __str__(self):
        return self.attribute

    def image_tag(self):
        current_site = Site.objects.get_current()
        return mark_safe(f'<img src="https://{current_site.domain}/api/images/{self.image_path}" width="100" />')

    class Meta:
        managed = False
        db_table = 'cart_order_items'


class Category(models.Model):
    id = models.BigAutoField(primary_key=True)
    created = models.DateTimeField()
    image_path = models.CharField(max_length=255)
    slug = models.TextField()
    specs = models.TextField(blank=True, null=True)
    title = models.TextField()
    updated = models.DateTimeField()

    def image_tag(self):
        current_site = Site.objects.get_current()
        return mark_safe(f'<img src="https://{current_site.domain}/api/images/{self.image_path}" width="100" />')
    def __str__(self):
        return self.title

    class Meta:
        managed = False
        db_table = 'category'


class Color(models.Model):
    id = models.BigAutoField(primary_key=True)
    color_code = models.CharField(max_length=400, blank=True, null=True)
    mission = models.CharField(max_length=400, blank=True, null=True)
    title = models.CharField(max_length=200)
    def __str__(self):
        return self.title

    def color_bg(self):
        return mark_safe('<div style="width:30px; height:30px; background-color:%s"></div>' % (self.color_code))
    class Meta:
        managed = False
        db_table = 'color'


class ContactForms(models.Model):
    id = models.BigAutoField(primary_key=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    def __str__(self):
        return self.email
    class Meta:
        managed = False
        db_table = 'contact_forms'


class Length(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.BigIntegerField()
    def __str__(self):
      return str(self.title)
    class Meta:
        managed = False
        db_table = 'length'


class Orders(models.Model):
    id = models.BigAutoField(primary_key=True)
    created = models.DateTimeField()
    order_id = models.CharField(unique=True, max_length=400, blank=True, null=True)
    order_status = models.BooleanField()
    paid_status = models.CharField(max_length=400, blank=True, null=True)
    total_amt = models.DecimalField(max_digits=38, decimal_places=2)
    user = models.ForeignKey(AppUser, models.DO_NOTHING)

    def __str__(self):
        return self.order_id
    class Meta:
        managed = False
        db_table = 'orders'


class Product(models.Model):
    id = models.BigAutoField(primary_key=True)
    bin_path = models.CharField(max_length=500, blank=True, null=True)
    created = models.DateTimeField()
    debut = models.DateField()
    fin = models.DateField()
    gltf_path = models.CharField(max_length=500, blank=True, null=True)
    is_featured = models.BooleanField()
    slug = models.CharField(max_length=255)
    specs = models.TextField()
    status = models.BooleanField()
    texture_path = models.CharField(max_length=500, blank=True, null=True)
    title = models.TextField()
    updated = models.DateTimeField()
    brand = models.ForeignKey(Brand, models.DO_NOTHING)
    category = models.ForeignKey(Category, models.DO_NOTHING)
    user = models.ForeignKey(AppUser, models.DO_NOTHING)

    def __str__(self):
        return self.title
    class Meta:
        managed = False
        db_table = 'product'


class ProductAttribute(models.Model):
    id = models.BigAutoField(primary_key=True)
    image_path = models.CharField(max_length=255, blank=True, null=True)
    price = models.DecimalField(max_digits=38, decimal_places=2)
    qte = models.IntegerField()
    sales = models.IntegerField()
    text = models.TextField()
    detail = models.TextField()
    texture_path = models.CharField(max_length=255, blank=True, null=True)
    video_path = models.CharField(max_length=255, blank=True, null=True)
    color = models.ForeignKey(Color, models.DO_NOTHING)
    length = models.ForeignKey(Length, models.DO_NOTHING, blank=True, null=True)
    product = models.ForeignKey(Product, models.DO_NOTHING)
    size = models.ForeignKey('Size', models.DO_NOTHING)
    user = models.ForeignKey(AppUser, models.DO_NOTHING)
    def image_tag(self):
        current_site = Site.objects.get_current()
        return mark_safe(f'<img src="https://{current_site.domain}/api/images/{self.image_path}" width="100" />')

    class Meta:
        managed = False
        db_table = 'product_attribute'


class ShopAddresses(models.Model):
    id = models.BigAutoField(primary_key=True)
    added = models.DateTimeField()
    address = models.CharField(max_length=255)
    cardexp = models.BinaryField()
    cardname = models.CharField(max_length=255)
    cardnum = models.BigIntegerField()
    city = models.CharField(max_length=255)
    country = models.CharField(max_length=255)
    cvv = models.BigIntegerField()
    email = models.CharField(max_length=255)
    phone = models.BigIntegerField()
    state = models.CharField(max_length=255)
    status = models.BooleanField()
    zipcode = models.CharField(max_length=255)
    user = models.ForeignKey(AppUser, models.DO_NOTHING)
    
    class Meta:
        managed = False
        db_table = 'shop_addresses'


class Size(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=200)
    def __str__(self):
        return self.title
    class Meta:
        managed = False
        db_table = 'size'
