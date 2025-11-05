export interface UserSession
{
    id: string;
    username: string;
    email_address: string;
    first_name:  string;
    last_name:  string;
    title:  string;
    avatar?: string;
    active?: boolean;
    session_status: string;
    security_level: string;
    user_id: string;
    socket_id: string;
    sip_enabled: boolean;
    sip_extension: string;
    sip_password: string;
    sip_server: string;
}
