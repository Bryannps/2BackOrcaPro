/**
 * Exception Filter para capturar e logar erros de validação
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    
    console.log('🚨 Validation Error Caught:');
    console.log('Request URL:', request.url);
    console.log('Request Method:', request.method);
    console.log('Request Body:', JSON.stringify(request.body, null, 2));
    console.log('Exception message:', exception.message);
    console.log('Exception response:', JSON.stringify(exception.getResponse(), null, 2));
    
    const exceptionResponse = exception.getResponse();
    
    response
      .status(400)
      .json({
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: exception.message,
        details: exceptionResponse,
      });
  }
}