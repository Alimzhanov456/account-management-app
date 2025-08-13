export interface Label {
  text: string;
}

// Тип записи - только два варианта
export type AccountType = 'LDAP' | 'Локальная';

// Основной интерфейс учетной записи
export interface Account {
  id: string;
  labels: Label[];           
  type: AccountType;         
  login: string;            
  password: string | null;  
}

// Интерфейс для ошибок валидации
export interface ValidationErrors {
  login?: string;
  password?: string;
}

// Интерфейс для создания новой записи
export interface NewAccountData {
  labels?: string;  
  type: AccountType;
  login: string;
  password: string;
}