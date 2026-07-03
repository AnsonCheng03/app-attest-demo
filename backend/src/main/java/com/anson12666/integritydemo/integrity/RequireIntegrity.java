package com.anson12666.integritydemo.integrity;

import com.anson12666.integritydemo.model.IntegrityAction;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireIntegrity {

    IntegrityAction value();

    boolean authenticated() default false;
}
