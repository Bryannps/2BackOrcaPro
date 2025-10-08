/**
 * Interceptor para logging de requisições - DEBUG
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query } = request;

    console.log('🔍 Request intercepted:');
    console.log(`Method: ${method}`);
    console.log(`URL: ${url}`);
    console.log(`Body:`, JSON.stringify(body, null, 2));
    console.log(`Params:`, params);
    console.log(`Query:`, query);

    const now = Date.now();
    
    return next
      .handle()
      .pipe(
        tap((data) => {
          console.log(`✅ Response (${Date.now() - now}ms):`, JSON.stringify(data, null, 2));
        }),
        catchError((error) => {
          console.log(`❌ Error (${Date.now() - now}ms):`, error.message);
          console.log(`Error details:`, error);
          throw error;
        })
      );
  }
}