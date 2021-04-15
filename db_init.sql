CREATE DATABASE IF NOT EXISTS `tmcontroljs`;

USE `tmcontroljs`;

CREATE TABLE IF NOT EXISTS `tmcontroljs`.`players` ( `id` INT NOT NULL AUTO_INCREMENT , `login` VARCHAR(100) NOT NULL , `nickname` VARCHAR(100) NOT NULL , `perms` INT NOT NULL DEFAULT '0' , PRIMARY KEY (`id`));

