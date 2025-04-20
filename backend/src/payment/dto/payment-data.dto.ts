import { PaymentMethod } from "@prisma/client";
import { PaymentStatus } from "@prisma/client";

export class PaymentDataDto {
  orderId: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  orderInfo?: string;
}
