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

export class RegistrationRequest implements Message {
  type: string = 'reg';
  data: {
    name: string;
    password: string;
  };
  id: number = 0;

  constructor(name: string, password: string) {
    this.data = { name, password };
  }
}

export class RegistrationResponse implements Message {
  type: string = 'reg';
  data: {
    name: string;
    index: number | string;
    error: boolean;
    errorText: string;
  };
  id: number = 0;

  constructor(name: string, index: number | string, error: boolean, errorText: string) {
    this.data = { name, index, error, errorText };
  }
}
