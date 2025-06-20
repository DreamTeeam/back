 import { UnauthorizedException } from '@nestjs/common';
 import * as jwt from 'jsonwebtoken';


 export function extractEmployeeIdFromToken(authHeader: string): number {
  if (!authHeader) throw new UnauthorizedException('No token provided');

  const token = authHeader.replace('Bearer ', '');
   try {
     const decoded = jwt.decode(token) as { employeeId?: number };
     if (!decoded || !decoded.employeeId) {
       throw new UnauthorizedException('Invalid token');
     }
     return decoded.employeeId;
   } catch {
     throw new UnauthorizedException('Failed to decode token');
   }
 }
