import nodemailer from 'nodemailer';
import { createHandlers } from '../lib/contact-handler.mjs';
const handlers = createHandlers({ getEnv: () => process.env, createTransport: options => nodemailer.createTransport(options) });
export const GET = handlers.GET;
export const POST = handlers.POST;
export const OPTIONS = handlers.OPTIONS;
