export interface Users{
    uid: string;
    name: string;
    email: string;
    password?: string;//Seguridad a la hora de registrar
    photo?: string;
    ciudad?: string;
    total_tasks?: number;
    rol: string;
}