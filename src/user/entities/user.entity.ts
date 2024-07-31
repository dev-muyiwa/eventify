export class User {
  id: string;
  first_name: string;
  last_name: string;
  dob: Date;
  email: string;
  password: string;
  profile_image_path?: string;
  bio?: string;
  location?: string;
  created_at: Date;
  updated_at: Date;
}
