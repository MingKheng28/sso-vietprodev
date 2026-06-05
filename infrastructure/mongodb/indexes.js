db.getSiblingDB('sso_audit').audit_logs.createIndex({createdAt:-1});
db.getSiblingDB('sso_audit').audit_logs.createIndex({eventType:1,createdAt:-1});
db.getSiblingDB('sso_audit').audit_logs.createIndex({userId:1,createdAt:-1});
db.getSiblingDB('sso_audit').audit_logs.createIndex({clientApp:1,createdAt:-1});
db.getSiblingDB('sso_audit').audit_logs.createIndex({requestId:1});
