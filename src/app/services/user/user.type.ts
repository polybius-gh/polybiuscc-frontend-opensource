export interface SipData {
  id: string;
  extension: string;
  sip_password: string;
  sip_server: string;
}

export interface User
{
    id: string;
    username: string;
    email_address: string;
    first_name:  string;
    last_name:  string;
    title:  string;
    avatar?: string;
    active?: boolean;
    security_level: string;
    sip_enabled: boolean;
    sipData?: SipData;
}
