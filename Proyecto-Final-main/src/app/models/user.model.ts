export interface User{//Ponemos ? para que en el LocalStorage no haya problemas
    uid: string;
    name: string;
    age?: number;
    email: string;
    password?: string;//Seguridad a la hora de registrar
    photo?: string;
    city?: string;
    rol?: string;
    achievements?: [];
}

export interface achievements{
  name: string,
  description: string
  photo?: string
}