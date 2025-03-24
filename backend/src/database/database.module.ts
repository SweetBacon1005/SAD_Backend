import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../schemas/product.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Cart, CartSchema } from '../schemas/cart.schema';
import { Order, OrderSchema } from 'src/schemas/order.schema';
import { Review, ReviewSchema } from 'src/schemas/review.schema';
import { Wishlist, WishlistSchema } from 'src/schemas/wishlist.schema';
import { Store, StoreSchema } from 'src/schemas/store.schema';
import {
  Notification,
  NotificationSchema,
} from 'src/schemas/notification.schema';
import { Category, CategorySchema } from 'src/schemas/category.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Wishlist.name, schema: WishlistSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
