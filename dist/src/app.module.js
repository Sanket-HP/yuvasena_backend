"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const members_module_1 = require("./members/members.module");
const events_module_1 = require("./events/events.module");
const complaints_module_1 = require("./complaints/complaints.module");
const news_module_1 = require("./news/news.module");
const gallery_module_1 = require("./gallery/gallery.module");
const notifications_module_1 = require("./notifications/notifications.module");
const analytics_module_1 = require("./analytics/analytics.module");
const geography_module_1 = require("./geography/geography.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            members_module_1.MembersModule,
            events_module_1.EventsModule,
            complaints_module_1.ComplaintsModule,
            news_module_1.NewsModule,
            gallery_module_1.GalleryModule,
            notifications_module_1.NotificationsModule,
            analytics_module_1.AnalyticsModule,
            geography_module_1.GeographyModule
        ]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map