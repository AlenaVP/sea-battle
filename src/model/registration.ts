export interface Message {
  type: string;
  data: any;
  id: number;
}

export interface Player {
  name: string;
  password: string;
}

export interface AddPlayerResult {
  error: boolean,
  errorText: string,
}

export interface RegistrationRequest {
  type: 'reg';
  data: {
    name: string;
    password: string;
  };
  id: 0;
}

export interface RegistrationResponse {
  type: 'reg';
  data: {
    name: string;
    index: number | string;
    error: boolean;
    errorText: string;
  };
  id: 0;
}
