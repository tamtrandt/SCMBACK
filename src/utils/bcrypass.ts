import * as bcrypt from 'bcrypt';
const saltOrRounds = 10;

export const hashPassword = async (password: string): Promise<string> => {
    try {
        
        return await bcrypt.hash(password, saltOrRounds);;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Hashing password failed'); 
    }
};

export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
