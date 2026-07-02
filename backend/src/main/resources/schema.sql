create table if not exists ios_device (
    key_id varchar(255) primary key,
    user_id varchar(255) not null,
    device_id varchar(255) not null,
    public_key clob not null,
    sign_count bigint not null,
    created_at timestamp with time zone not null
);
