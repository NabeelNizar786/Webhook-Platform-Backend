import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({ email, password: hashed });
    return { id: user._id, email: user.email };
  }

  async login(email: string, password: string) {
    const user:any = await this.userModel.findOne({ email }).lean();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    delete user.password

    const payload = { sub: user._id, email: user.email };
    return {
      ...user,
      access_token: this.jwtService.sign(payload),
    };
  }
}
