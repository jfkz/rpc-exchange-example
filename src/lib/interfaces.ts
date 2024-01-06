import { COIN } from './consts';

export type OrderType = 'buy' | 'sell';
export type OrderStatus = 'open' | 'accepting' | 'closed';

export enum ERequestType {
  'order_announce' = 'order_announce',
  'order_match' = 'order_match',
  'order_accepted' = 'order_accepted',
  'order_closed' = 'order_closed',
  'order_rejected' = 'order_rejected',
}

export interface IOrder {
  id: string;
  coin: COIN;
  type: OrderType;
  price: number;
  status: OrderStatus;
}

export interface IRequestPayloadWithoutSender {
  type: ERequestType;
  data?: {
    recipient?: string;
    order?: IOrder;
    matchId?: string;
  };
}

export interface IRequestPayload extends IRequestPayloadWithoutSender {
  sender: string;
}

export type IResponsePayloadWithoutSender = IRequestPayloadWithoutSender;

export interface IResponsePayload extends IResponsePayloadWithoutSender {
  sender: string;
}
