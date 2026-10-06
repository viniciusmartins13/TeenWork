

CREATE DATABASE IF NOT EXISTS `teenwork` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `teenwork`;

CREATE TABLE IF NOT EXISTS `Users` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(120) NOT NULL,
  `Email` varchar(180) NOT NULL,
  `PasswordHash` varchar(100) NOT NULL,
  `UserType` int NOT NULL,
  `ProfileImage` varchar(300) NULL,
  `IsActive` tinyint(1) NOT NULL,
  `LastLoginAt` datetime(6) NULL,
  `PasswordResetTokenHash` varchar(64) NULL,
  `PasswordResetTokenExpiresAt` datetime(6) NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Users_Email` (`Email`),
  KEY `IX_Users_UserType` (`UserType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `CompanyProfiles` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  `CompanyName` varchar(150) NOT NULL,
  `Description` text NULL,
  `Cnpj` char(14) NULL,
  `Industry` varchar(80) NULL,
  `City` varchar(100) NULL,
  `State` char(2) NULL,
  `Website` varchar(300) NULL,
  `Logo` varchar(300) NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_CompanyProfiles_UserId` (`UserId`),
  UNIQUE KEY `IX_CompanyProfiles_Cnpj` (`Cnpj`),
  KEY `IX_CompanyProfiles_CompanyName` (`CompanyName`),
  CONSTRAINT `FK_CompanyProfiles_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Notifications` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  `Title` varchar(150) NOT NULL,
  `Message` varchar(1500) NOT NULL,
  `Type` int NOT NULL,
  `Link` varchar(300) NULL,
  `IsRead` tinyint(1) NOT NULL,
  `ReadAt` datetime(6) NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Notifications_UserId_IsRead_CreatedAt` (`UserId`, `IsRead`, `CreatedAt`),
  CONSTRAINT `FK_Notifications_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `StudentProfiles` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  `School` varchar(150) NULL,
  `Course` varchar(120) NULL,
  `SchoolYear` varchar(40) NULL,
  `GraduationYear` int NULL,
  `City` varchar(100) NULL,
  `State` char(2) NULL,
  `Bio` varchar(1500) NULL,
  `Skills` varchar(1300) NULL,
  `PortfolioUrl` varchar(300) NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_StudentProfiles_UserId` (`UserId`),
  CONSTRAINT `FK_StudentProfiles_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Jobs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CompanyId` int NOT NULL,
  `Title` varchar(150) NOT NULL,
  `Description` text NOT NULL,
  `Requirements` text NULL,
  `Benefits` text NULL,
  `Area` varchar(80) NOT NULL,
  `City` varchar(100) NOT NULL,
  `State` char(2) NOT NULL,
  `WorkModel` int NOT NULL,
  `JobType` int NOT NULL,
  `Salary` decimal(10,2) NULL,
  `Workload` varchar(60) NULL,
  `Vacancies` int NOT NULL,
  `Status` int NOT NULL,
  `Deadline` date NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Jobs_Area` (`Area`),
  KEY `IX_Jobs_CompanyId` (`CompanyId`),
  KEY `IX_Jobs_State_City` (`State`, `City`),
  KEY `IX_Jobs_Status_CreatedAt` (`Status`, `CreatedAt`),
  CONSTRAINT `FK_Jobs_CompanyProfiles_CompanyId` FOREIGN KEY (`CompanyId`) REFERENCES `CompanyProfiles` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `StudentExperiences` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StudentId` int NOT NULL,
  `Title` varchar(120) NOT NULL,
  `Organization` varchar(150) NOT NULL,
  `Type` int NOT NULL,
  `StartDate` date NOT NULL,
  `EndDate` date NULL,
  `Description` varchar(1500) NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_StudentExperiences_StudentId` (`StudentId`),
  CONSTRAINT `FK_StudentExperiences_StudentProfiles_StudentId` FOREIGN KEY (`StudentId`) REFERENCES `StudentProfiles` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Applications` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `JobId` int NOT NULL,
  `StudentId` int NOT NULL,
  `Status` int NOT NULL,
  `CoverLetter` text NULL,
  `CompanyFeedback` varchar(1000) NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Applications_JobId_StudentId` (`JobId`, `StudentId`),
  KEY `IX_Applications_StudentId_Status` (`StudentId`, `Status`),
  CONSTRAINT `FK_Applications_Jobs_JobId` FOREIGN KEY (`JobId`) REFERENCES `Jobs` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Applications_StudentProfiles_StudentId` FOREIGN KEY (`StudentId`) REFERENCES `StudentProfiles` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `SavedJobs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StudentId` int NOT NULL,
  `JobId` int NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_SavedJobs_JobId` (`JobId`),
  UNIQUE KEY `IX_SavedJobs_StudentId_JobId` (`StudentId`, `JobId`),
  CONSTRAINT `FK_SavedJobs_Jobs_JobId` FOREIGN KEY (`JobId`) REFERENCES `Jobs` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_SavedJobs_StudentProfiles_StudentId` FOREIGN KEY (`StudentId`) REFERENCES `StudentProfiles` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Controle de migrations do EF Core (evita que a API tente recriar as tabelas).
CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
  `MigrationId` varchar(150) NOT NULL,
  `ProductVersion` varchar(32) NOT NULL,
  PRIMARY KEY (`MigrationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES ('20260921190000_InitialCreate', '9.0.0');
