CREATE TYPE "public"."intent_type" AS ENUM('lend', 'borrow');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('active', 'repaid', 'defaulted');--> statement-breakpoint
CREATE TYPE "public"."position_status" AS ENUM('active', 'repaid', 'defaulted');--> statement-breakpoint
CREATE TYPE "public"."tranche" AS ENUM('senior', 'junior');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric,
	"tx_hash" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "intents" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"amount" numeric NOT NULL,
	"min_rate" numeric,
	"max_rate" numeric,
	"duration" integer NOT NULL,
	"tranche" "tranche",
	"type" "intent_type" NOT NULL,
	"signature" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lender_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"lender" text NOT NULL,
	"amount" numeric NOT NULL,
	"tranche" "tranche" NOT NULL,
	"status" "position_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"borrower" text NOT NULL,
	"principal" numeric NOT NULL,
	"collateral_amount" numeric NOT NULL,
	"rate" integer NOT NULL,
	"duration" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"senior_lenders" jsonb NOT NULL,
	"senior_amounts" jsonb NOT NULL,
	"junior_lenders" jsonb NOT NULL,
	"junior_amounts" jsonb NOT NULL,
	"status" "loan_status" DEFAULT 'active' NOT NULL,
	CONSTRAINT "loans_loan_id_unique" UNIQUE("loan_id")
);
