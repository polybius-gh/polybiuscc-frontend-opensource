export interface Contact {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  phone: string;
}

export interface Address {
  id: string;
  customer_id: string;
  type: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Phone {
  id: string;
  customer_id: string;
  type: string;
  number: string;
  extension?: string;
}

export interface Note {
  id: string;
  customer_id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Customer
{
    id: string;
    name: string;
    company_name: string;
    email_address: string;
    status: boolean;
    contacts?: Contact[];
    addresses?: Address[];
    phones?: Phone[];
    notes?: Note[]; 
}
