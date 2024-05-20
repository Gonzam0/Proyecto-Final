export interface User{
    uid: string;
    name: string;
    edad?: number;
    email: string;
    password?: string;//Seguridad a la hora de registrar
    photo?: string;
    ciudad?: string;
    rol: string;
}