export interface Message {
  type: string;
  data: any;
  id: number;
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

export class CreateRoomRequest implements Message {
  type: string = 'create_room';
  data: string = '';
  id: number = 0;
}

export class AddUserToRoomRequest implements Message {
  type: string = 'add_user_to_room';
  data: {
    indexRoom: number | string;
  };
  id: number = 0;

  constructor(indexRoom: number | string) {
    this.data = { indexRoom };
  }
}

export class CreateGameResponse implements Message {
  type: string = 'create_game';
  data: {
    idGame: number | string;
    idPlayer: number | string;
  };
  id: number = 0;

  constructor(idGame: number | string, idPlayer: number | string) {
    this.data = { idGame, idPlayer };
  }
}

export class UpdateRoomResponse implements Message {
  type: string = 'update_room';
  data: Room[];
  id: number = 0;

  constructor(rooms: Room[]) {
    this.data = rooms;
  }
}

export interface Player {
  name: string;
  password: string;
}

export interface AddPlayerResult {
  error: boolean,
  errorText: string,
}

export interface Room {
  roomId: number | string,
  roomUsers:
  [
    {
      name: string,
      index: number | string,
    }
  ],
}
