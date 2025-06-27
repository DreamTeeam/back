// Proposed location: src/master_modules/auth/strategies/google.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      // We now use a single, global callback URL
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      // This option is crucial to get access to the 'state' parameter from the request
      passReqToCallback: true,
    });
  }

  /**
   * This function is called after Google successfully authenticates the user.
   * Its only job is to extract the necessary data and pass it to the AuthService.
   */
  async validate(
    req: Request, // We now have access to the request object
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    //FIXME MANEJAR POSIBLES ERRORES(ABAJO UNA OPCION PARA HACERLO)
    const userProfile = {
      email: emails![0].value,
      first_name: name!.givenName,
      last_name: name!.familyName,
      // picture: photos[0].value, // We can include this if needed
    };

    // if (!emails?.length || !name?.givenName || !name?.familyName) {
    //   return done(new Error('Incomplete Google profile data'));
    // }

    // const userProfile = {
    //   email: emails[0].value,
    //   first_name: name.givenName,
    //   last_name: name.familyName,
    // };

    // We extract the 'state' parameter that we will send in the initial request.
    // The AuthService will use this state to link the user to a tenant
    // if it's a new registration from a public page.
    const state = req.query.state as string | undefined;

    // We pass a structured object to the next step in the Passport flow.
    done(null, { profile: userProfile, state });
  }
}
