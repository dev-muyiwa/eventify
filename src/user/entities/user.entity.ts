export class User {
  id: string;
  first_name: string;
  last_name: string;
  dob: Date;
  email: string;
  password: string;
  profile_image_path?: string;
  bio?: string;
  roles: UserRole[];
  location?: string;
  created_at: Date;
  updated_at: Date;
}

export enum UserRole {
  USER = 'user',
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
}
