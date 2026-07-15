--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AdPlacement; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AdPlacement" AS ENUM (
    'BLOG_SIDEBAR',
    'ARTICLE_SIDEBAR',
    'BLOG_INLINE'
);


--
-- Name: BugSeverity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BugSeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: BugStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BugStatus" AS ENUM (
    'OPEN',
    'RESOLVED',
    'WONT_FIX'
);


--
-- Name: CommentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CommentStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'SPAM'
);


--
-- Name: PageStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PageStatus" AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'SUPER_ADMIN',
    'DEVELOPER',
    'TESTER',
    'SEO_MANAGER'
);


--
-- Name: VideoProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VideoProvider" AS ENUM (
    'YOUTUBE',
    'VIMEO',
    'FILE'
);


--
-- Name: WorkflowStage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WorkflowStage" AS ENUM (
    'DRAFT',
    'TESTING',
    'SEO_REVIEW',
    'APPROVAL',
    'APPROVED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AdBanner; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AdBanner" (
    id text NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    "imageUrl" text,
    "targetUrl" text NOT NULL,
    placement public."AdPlacement" DEFAULT 'BLOG_SIDEBAR'::public."AdPlacement" NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "startsAt" timestamp(3) without time zone,
    "endsAt" timestamp(3) without time zone,
    impressions integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AiGeneration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AiGeneration" (
    id text NOT NULL,
    "userId" text,
    "userName" text,
    kind text NOT NULL,
    model text NOT NULL,
    "inputChars" integer NOT NULL,
    "outputChars" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    meta jsonb,
    ip text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: BlogComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BlogComment" (
    id text NOT NULL,
    "postId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    body text NOT NULL,
    rating integer,
    status public."CommentStatus" DEFAULT 'PENDING'::public."CommentStatus" NOT NULL,
    reply text,
    "repliedAt" timestamp(3) without time zone,
    "ipHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BlogPost; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BlogPost" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text DEFAULT ''::text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'General'::text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    "coverUrl" text,
    status public."PageStatus" DEFAULT 'DRAFT'::public."PageStatus" NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "scheduledAt" timestamp(3) without time zone,
    "readingMinutes" integer DEFAULT 1 NOT NULL,
    "seoTitle" text,
    "seoDescription" text,
    "noIndex" boolean DEFAULT false NOT NULL,
    "authorId" text,
    "authorName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BugReport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BugReport" (
    id text NOT NULL,
    "pageId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    severity public."BugSeverity" DEFAULT 'MEDIUM'::public."BugSeverity" NOT NULL,
    status public."BugStatus" DEFAULT 'OPEN'::public."BugStatus" NOT NULL,
    "screenshotUrl" text,
    "reportedById" text,
    "reportedByName" text,
    "resolvedById" text,
    "resolvedByName" text,
    "resolvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Form; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Form" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    "notifyEmail" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FormSubmission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FormSubmission" (
    id text NOT NULL,
    "formId" text NOT NULL,
    data jsonb NOT NULL,
    ip text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MediaAsset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MediaAsset" (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    width integer,
    height integer,
    alt text DEFAULT ''::text NOT NULL,
    url text NOT NULL,
    "uploadedById" text,
    "uploadedByName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: NewsletterSubscriber; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."NewsletterSubscriber" (
    id text NOT NULL,
    email text NOT NULL,
    source text DEFAULT 'blog'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    link text,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Page; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Page" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    status public."PageStatus" DEFAULT 'DRAFT'::public."PageStatus" NOT NULL,
    sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    "seoTitle" text,
    "seoDescription" text,
    "canonicalUrl" text,
    "ogImage" text,
    "noIndex" boolean DEFAULT false NOT NULL,
    "schemaJson" jsonb,
    "publishedAt" timestamp(3) without time zone,
    "scheduledAt" timestamp(3) without time zone,
    "createdById" text,
    "updatedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "workflowStage" public."WorkflowStage" DEFAULT 'DRAFT'::public."WorkflowStage" NOT NULL
);


--
-- Name: PageComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PageComment" (
    id text NOT NULL,
    "pageId" text NOT NULL,
    body text NOT NULL,
    "stageAtTime" public."WorkflowStage" NOT NULL,
    "authorId" text,
    "authorName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PageVersion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PageVersion" (
    id text NOT NULL,
    "pageId" text NOT NULL,
    version integer NOT NULL,
    title text NOT NULL,
    sections jsonb NOT NULL,
    "seoSnapshot" jsonb NOT NULL,
    note text,
    "createdById" text,
    "createdByName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PageView; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PageView" (
    id text NOT NULL,
    path text NOT NULL,
    referrer text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Redirect; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Redirect" (
    id text NOT NULL,
    "fromPath" text NOT NULL,
    "toPath" text NOT NULL,
    permanent boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    hits integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    "tokenHash" text NOT NULL,
    "userId" text NOT NULL,
    "userAgent" text,
    ip text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SiteSetting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SiteSetting" (
    key text NOT NULL,
    value jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."Role" DEFAULT 'DEVELOPER'::public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Video; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Video" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    provider public."VideoProvider" NOT NULL,
    "videoId" text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'General'::text NOT NULL,
    "thumbnailUrl" text,
    "durationSec" integer,
    featured boolean DEFAULT false NOT NULL,
    "uploadedByName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: WorkflowTransition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WorkflowTransition" (
    id text NOT NULL,
    "pageId" text NOT NULL,
    "from" public."WorkflowStage" NOT NULL,
    "to" public."WorkflowStage" NOT NULL,
    note text,
    "byId" text,
    "byName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: AdBanner; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AdBanner" (id, title, description, "imageUrl", "targetUrl", placement, active, "startsAt", "endsAt", impressions, clicks, "createdAt", "updatedAt") FROM stdin;
cmrl64is10001t6ko4eg51pj7	Is your website leaking leads?	Free 15-page audit — SEO, speed, UX and conversion. In 48 hours.	/services/development.jpg	/#audit	ARTICLE_SIDEBAR	t	\N	\N	5	0	2026-07-14 21:33:31.537	2026-07-14 22:13:45.438
cmrl64is10000t6ko5ywej6pe	Now advertising on JioHotstar Smart TV	Grow beyond search — reach 40M+ households with Smart TV ads.	/services/marketing.jpg	/#audit	BLOG_SIDEBAR	f	\N	\N	7	1	2026-07-14 21:33:31.537	2026-07-14 22:15:08.586
\.


--
-- Data for Name: AiGeneration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiGeneration" (id, "userId", "userName", kind, model, "inputChars", "outputChars", "createdAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "userId", action, entity, "entityId", meta, ip, "createdAt") FROM stdin;
cmr92e94j0003t6is4xq5kqbd	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 10:15:53.011
cmr936i8v0007t6isyy9iru4x	cmr92chs50000t6cklv6m3y9t	auth.logout	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 10:37:51.199
cmr936il3000bt6isl5uolet0	cmr92ci1j0001t6ck3cn60p6l	auth.login	user	cmr92ci1j0001t6ck3cn60p6l	\N	::1	2026-07-06 10:37:51.639
cmr9dc95s0003t67o6emk9ptk	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 15:22:15.52
cmr9e6bfz0003t6x47ot4oez7	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 15:45:38.159
cmr9e6cn00007t6x4mmuywe2j	cmr92chs50000t6cklv6m3y9t	page.update	page	cmr9e48l40005t6m0ni8n61e8	{"slug": "digital-marketing-services", "fields": ["title", "sections", "versionNote"]}	::1	2026-07-06 15:45:39.708
cmr9e6dkv000bt6x4c07h5sea	cmr92chs50000t6cklv6m3y9t	page.restore_version	page	cmr9e48l40005t6m0ni8n61e8	{"restored": 1}	::1	2026-07-06 15:45:40.927
cmr9e6dlo000gt6x4kc4joe35	cmr92chs50000t6cklv6m3y9t	page.create	page	cmr9e6dlj000dt6x4f6a64611	{"slug": "draft-test-page"}	::1	2026-07-06 15:45:40.957
cmr9e6rn6000kt6x4oamcv177	cmr92cikh0003t6cky1knny6c	auth.login	user	cmr92cikh0003t6cky1knny6c	\N	::1	2026-07-06 15:45:59.155
cmr9e6rpu000ot6x4b7wk2v2q	cmr92cikh0003t6cky1knny6c	page.update	page	cmr9e6dlj000dt6x4f6a64611	{"slug": "draft-test-page", "fields": ["seoTitle"]}	::1	2026-07-06 15:45:59.251
cmr9e6stk000st6x40tc50md1	cmr92ciav0002t6ckbbqnn7w4	auth.login	user	cmr92ciav0002t6ckbbqnn7w4	\N	::1	2026-07-06 15:46:00.68
cmr9e6t53000wt6x438d5ix6k	cmr92ci1j0001t6ck3cn60p6l	auth.login	user	cmr92ci1j0001t6ck3cn60p6l	\N	::1	2026-07-06 15:46:01.095
cmr9e6t8m0010t6x4te58bkos	cmr92ci1j0001t6ck3cn60p6l	page.update	page	cmr9e6dlj000dt6x4f6a64611	{"slug": "draft-test-page", "fields": ["title"]}	::1	2026-07-06 15:46:01.223
cmr9e77nt0014t6x4q2vc6fom	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 15:46:19.913
cmr9e77u20016t6x4ta0luvxd	cmr92chs50000t6cklv6m3y9t	page.delete	page	cmr9e6dlj000dt6x4f6a64611	{"slug": "draft-test-page"}	::1	2026-07-06 15:46:20.139
cmr9fqsmr0003t68wl6ht81ch	cmr92ci1j0001t6ck3cn60p6l	auth.login	user	cmr92ci1j0001t6ck3cn60p6l	\N	::1	2026-07-06 16:29:33.171
cmr9fqssg0008t68wil673yqv	cmr92ci1j0001t6ck3cn60p6l	page.create	page	cmr9fqsrq0005t68w6s0kif3j	{"slug": "workflow-demo"}	::1	2026-07-06 16:29:33.376
cmr9fqutc000ct68wfxwe0o0i	cmr92ci1j0001t6ck3cn60p6l	workflow.submit_for_testing	page	cmr9fqsrq0005t68w6s0kif3j	{"to": "TESTING", "from": "DRAFT"}	::1	2026-07-06 16:29:36
cmr9fqvea000it68wvahubam5	cmr92ciav0002t6ckbbqnn7w4	auth.login	user	cmr92ciav0002t6ckbbqnn7w4	\N	::1	2026-07-06 16:29:36.755
cmr9fqwef000mt68wk0g7y84l	cmr92ciav0002t6ckbbqnn7w4	bug.create	bug	cmr9fqwdv000kt68w89f8wza6	{"pageId": "cmr9fqsrq0005t68w6s0kif3j", "severity": "HIGH"}	::1	2026-07-06 16:29:38.055
cmr9fqwhb000st68wdji12fll	cmr92ciav0002t6ckbbqnn7w4	workflow.test_fail	page	cmr9fqsrq0005t68w6s0kif3j	{"to": "DRAFT", "from": "TESTING", "note": "Mobile layout broken, see bug report."}	::1	2026-07-06 16:29:38.159
cmr9fqx0g000yt68wp9il1u06	cmr92ci1j0001t6ck3cn60p6l	auth.login	user	cmr92ci1j0001t6ck3cn60p6l	\N	::1	2026-07-06 16:29:38.849
cmr9fqxzu0012t68wkw2ykyrk	cmr92ci1j0001t6ck3cn60p6l	page.comment	page	cmr9fqsrq0005t68w6s0kif3j	\N	::1	2026-07-06 16:29:40.123
cmr9fqz210018t68w5ghoi49g	cmr92ci1j0001t6ck3cn60p6l	bug.update	bug	cmr9fqwdv000kt68w89f8wza6	{"status": "RESOLVED"}	::1	2026-07-06 16:29:41.497
cmr9fqz4u001ct68wrznrupv6	cmr92ci1j0001t6ck3cn60p6l	workflow.submit_for_testing	page	cmr9fqsrq0005t68w6s0kif3j	{"to": "TESTING", "from": "DRAFT"}	::1	2026-07-06 16:29:41.598
cmr9fqznf001it68wfludumlc	cmr92ciav0002t6ckbbqnn7w4	auth.login	user	cmr92ciav0002t6ckbbqnn7w4	\N	::1	2026-07-06 16:29:42.268
cmr9fqzot001mt68wdcq0s198	cmr92ciav0002t6ckbbqnn7w4	workflow.test_pass	page	cmr9fqsrq0005t68w6s0kif3j	{"to": "SEO_REVIEW", "from": "TESTING"}	::1	2026-07-06 16:29:42.317
cmr9fr07f001st68wa9wicdq6	cmr92cikh0003t6cky1knny6c	auth.login	user	cmr92cikh0003t6cky1knny6c	\N	::1	2026-07-06 16:29:42.987
cmr9fr0a1001wt68wx6zwz467	cmr92cikh0003t6cky1knny6c	workflow.seo_approve	page	cmr9fqsrq0005t68w6s0kif3j	{"to": "APPROVAL", "from": "SEO_REVIEW"}	::1	2026-07-06 16:29:43.081
cmr9fr0ov0021t68wnkisuaua	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 16:29:43.615
cmr9fr0q80025t68wjhxzixkx	cmr92chs50000t6cklv6m3y9t	workflow.approve	page	cmr9fqsrq0005t68w6s0kif3j	{"to": "APPROVED", "from": "APPROVAL"}	::1	2026-07-06 16:29:43.665
cmr9fr0s70029t68wa0hrzryf	cmr92chs50000t6cklv6m3y9t	page.publish	page	cmr9fqsrq0005t68w6s0kif3j	{"slug": "workflow-demo"}	::1	2026-07-06 16:29:43.735
cmr9frh3j002bt68wt640d35s	cmr92chs50000t6cklv6m3y9t	page.unpublish	page	cmr9e48l40005t6m0ni8n61e8	{"slug": "digital-marketing-services"}	::1	2026-07-06 16:30:04.879
cmr9frh6m002dt68w78dkkdr8	cmr92chs50000t6cklv6m3y9t	page.publish	page	cmr9e48l40005t6m0ni8n61e8	{"slug": "digital-marketing-services", "stage": "DRAFT", "forcedPastWorkflow": true}	::1	2026-07-06 16:30:04.991
cmr9frsth002ft68wlhuqn8yy	cmr92chs50000t6cklv6m3y9t	page.unpublish	page	cmr9fqsrq0005t68w6s0kif3j	{"slug": "workflow-demo"}	::1	2026-07-06 16:30:20.069
cmr9hhx7a0006t6m49czgi8ok	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 17:18:38.422
cmr9hhyls0009t6m4608421z5	cmr92chs50000t6cklv6m3y9t	media.upload	media	cmr9hhylk0007t6m404xv8xq8	{"size": 5590, "filename": "db89d3319237f4ae9620.webp"}	::1	2026-07-06 17:18:40.241
cmr9hi06u000dt6m4dqj6476t	cmr92ci1j0001t6ck3cn60p6l	auth.login	user	cmr92ci1j0001t6ck3cn60p6l	\N	::1	2026-07-06 17:18:42.294
cmr9hi0wq000ht6m4kyefk4ro	cmr92ciav0002t6ckbbqnn7w4	auth.login	user	cmr92ciav0002t6ckbbqnn7w4	\N	::1	2026-07-06 17:18:43.227
cmr9hi1c1000lt6m4j5jdhj4b	cmr92cikh0003t6cky1knny6c	auth.login	user	cmr92cikh0003t6cky1knny6c	\N	::1	2026-07-06 17:18:43.777
cmr9nqghk0007t6s8dzdgvf3f	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 20:13:14.36
cmr9nqgz3000at6s81e30hemj	cmr92chs50000t6cklv6m3y9t	redirect.create	redirect	cmr9nqgyr0008t6s8wrgivk3n	{"to": "/digital-marketing-services", "from": "/old-services"}	::1	2026-07-06 20:13:14.991
cmr9nqkmq000et6s83k8y0jrn	cmr92chs50000t6cklv6m3y9t	page.update	page	cmr9e48l40005t6m0ni8n61e8	{"slug": "digital-marketing-services", "fields": ["sections"]}	::1	2026-07-06 20:13:19.73
cmr9nqlgg000it6s8b3myivou	cmr92ciav0002t6ckbbqnn7w4	auth.login	user	cmr92ciav0002t6ckbbqnn7w4	\N	::1	2026-07-06 20:13:20.801
cmr9nqx3r000mt6s88ctu9he7	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 20:13:35.895
cmr9pjd5j0005t624cjfbsatt	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::ffff:127.0.0.1	2026-07-06 21:03:42.679
cmr9pjeor0008t624ibdxcfff	cmr92chs50000t6cklv6m3y9t	media.upload	media	cmr9pjeok0006t624sp04wijr	{"size": 84, "filename": "90ff64ce1d3934b1499f.webp"}	::ffff:127.0.0.1	2026-07-06 21:03:44.668
cmr9rphc40007t640taz9yxn0	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-06 22:04:27.269
cmr9rpiei000bt640rrvdz25y	cmr92chs50000t6cklv6m3y9t	page.update	page	cmr9rfo17000ct67o4eg5spij	{"slug": "about", "fields": ["seoTitle"]}	::1	2026-07-06 22:04:28.651
cmr9rpihc000ft640kmlqr4mk	cmr92chs50000t6cklv6m3y9t	page.update	page	cmr9rfo1i000ft67oa1mkwoyg	{"slug": "careers", "fields": ["seoTitle"]}	::1	2026-07-06 22:04:28.753
cmr9rpij2000jt640oz4fu83k	cmr92chs50000t6cklv6m3y9t	page.update	page	cmr9rfo1n000it67ou892j76k	{"slug": "privacy-policy", "fields": ["seoTitle"]}	::1	2026-07-06 22:04:28.815
cmr9rpikg000nt6409j1voytf	cmr92chs50000t6cklv6m3y9t	page.update	page	cmr9rfo1r000lt67o41ls6wc6	{"slug": "terms", "fields": ["seoTitle"]}	::1	2026-07-06 22:04:28.864
cmr9rpils000rt6402vsyxq5s	cmr92chs50000t6cklv6m3y9t	page.update	page	cmr9rfo1u000ot67o792tn1i2	{"slug": "refund-policy", "fields": ["seoTitle"]}	::1	2026-07-06 22:04:28.912
cmr9rpin6000vt640xxjxgm3v	cmr92chs50000t6cklv6m3y9t	page.update	page	cmr9rfo1x000rt67oirw5h80u	{"slug": "cookie-policy", "fields": ["seoTitle"]}	::1	2026-07-06 22:04:28.962
cmr9u8d8n000gt6f8h19e5il7	cmr92chs50000t6cklv6m3y9t	form.update	form	cmr9hgixx0009t6t8tctysxir	{"fields": ["fields"]}	::1	2026-07-06 23:15:07.655
cmrl6mw1t000ht6ss1c95ydv6	cmr92chs50000t6cklv6m3y9t	auth.login	user	cmr92chs50000t6cklv6m3y9t	\N	::1	2026-07-14 21:47:48.545
cmrl6mwyt000jt6ssdl26rioc	cmr92chs50000t6cklv6m3y9t	comment.moderate	blogComment	cmrl6mvqn000bt6ssu06fqiyg	{"status": "APPROVED", "replied": true}	::1	2026-07-14 21:47:49.733
cmrl7m1in000wt6ssjz9yitsl	cmr92chs50000t6cklv6m3y9t	ad.update	adBanner	cmrl64is10000t6ko5ywej6pe	{"title": "Now advertising on JioHotstar Smart TV", "active": false}	::1	2026-07-14 22:15:08.591
\.


--
-- Data for Name: BlogComment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BlogComment" (id, "postId", name, email, body, rating, status, reply, "repliedAt", "ipHash", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BlogPost; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BlogPost" (id, title, slug, excerpt, body, category, tags, "coverUrl", status, "publishedAt", "scheduledAt", "readingMinutes", "seoTitle", "seoDescription", "noIndex", "authorId", "authorName", "createdAt", "updatedAt") FROM stdin;
cmr9hgixm0007t6t8d1ggcy8g	Local SEO in 2026: the map-pack playbook	local-seo-2026-map-pack-playbook	Reviews, entity signals and service-area pages — what actually moves the local map pack this year.	The local map pack drives more calls than any blue link, yet most businesses treat their profile as a set-and-forget listing.\n\n## Reviews are the ranking signal you control\n\nVelocity beats volume: five fresh reviews a month outrank a hundred stale ones. Build the ask into your delivery workflow, not your marketing calendar.\n\n## Entity consistency\n\nName, address, phone — identical everywhere, including the schema markup on your site. Mismatches quietly cap your ranking.\n\n### Service-area pages that aren't spam\n\nOne page per city works only when each page says something true and specific about that city: local clients, local numbers, local proof.	SEO	{seo,local-seo}	/blog/local-seo.jpg	PUBLISHED	2026-07-06 17:17:33.273	\N	1	Local SEO in 2026: the map-pack playbook	Reviews, entity signals and service-area pages — what actually moves the local map pack this year.	f	cmr92cikh0003t6cky1knny6c	SEO One	2026-07-06 17:17:33.274	2026-07-11 17:37:28.531
cmrgndeji0000t6fc9ovlig2b	AI chatbots that actually convert — a field guide	ai-chatbots-that-convert	Prompts, qualification flows and handoff rules that separate toy bots from revenue channels.	Most "AI chatbots" are FAQ pages with a typing indicator. The ones that convert are built like sales assistants: they qualify, they route, and they know when to hand off to a human.\n\n## Give it one job\n\nA converting bot has a single goal per placement — book a demo, capture a qualified lead, or recover an abandoned cart. Bots that try to do everything answer everything vaguely.\n\n## Qualify before you converse\n\nTwo or three sharp questions early ("What are you looking to grow?", "What's your monthly budget range?") do more than ten pleasantries. Score the answers and route hot leads to WhatsApp or a call within minutes.\n\n## Design the handoff\n\nThe moment a conversation shows buying intent or frustration, a human should take over with the full transcript. The bot's job is the first mile, not the whole journey.\n\n## Measure like a channel\n\nTrack conversations started, qualified rate, handoff rate and revenue influenced — the same way you'd judge a paid channel. If a bot can't show pipeline after a month, change its script, not your patience.	AI	{}	/blog/ai-chatbots.jpg	PUBLISHED	2026-05-30 09:00:00	\N	5	\N	A field guide to AI chatbots that convert: qualification flows, human handoff and the metrics that prove revenue.	f	\N	DigiSutra Team	2026-07-11 17:37:28.542	2026-07-11 17:37:28.542
cmrhqa2ze0000t6xg804lrizv	Stop mourning clicks: how to get cited in AI Overviews	get-cited-in-google-ai-overviews-geo	Zero-click AI answers are eating your traffic. Here's how to become the source Google AI Overviews, ChatGPT and Perplexity actually cite.	Somewhere in 2025, Google started answering questions before anyone clicked. By mid-2026, ChatGPT and Perplexity do the same at scale, and business owners are staring at sagging traffic charts like it's a funeral.\n\nWrong instinct. The clicks didn't vanish — they concentrated. Every AI answer cites a handful of sources, and those sources inherit the trust of the whole answer. Your job is to be one of them. That is all GEO — generative engine optimization — really is.\n\n## What do Google AI Overviews actually pull from?\n\nAI Overviews pull from pages that answer the question directly in the first sentence, carry clean structured data, and are corroborated by mentions on third-party sites. Google still retrieves candidates through normal ranking, then lifts the sentence that answers the query.\n\nChatGPT and Perplexity behave similarly but lean harder on Bing's index, Reddit threads, review platforms and news mentions. Translation: GEO is not a new religion. It's SEO with a stricter editor.\n\n## How do you structure a page so AI can lift the answer?\n\nPut a one-to-two-sentence direct answer immediately under every heading, then elaborate — exactly the way this paragraph does. Machines quote what is quotable.\n\nPhrase your H2s as questions people actually ask, and keep each section on one question only. Answers of 40 to 60 words get lifted most cleanly.\n\nSpecifics win. A Noida dental page that says "teeth whitening costs Rs 8,000 to Rs 15,000 and takes one sitting" is citable. "Affordable, world-class smile solutions" is not.\n\n### Mark it up\n\nAdd FAQPage schema to question sections, Article schema to posts, and Organization schema with sameAs links to your profiles. Schema doesn't rank you; it makes you legible to machines.\n\n## Do third-party mentions matter more than backlinks now?\n\nFor AI citations, yes — models decide whether to quote you based on how consistently the wider web corroborates you, not on link equity alone. Start with boring consistency: identical business name, address and phone everywhere you appear online.\n\nThen get talked about where AI systems actually read: industry publications, credible directories, and Quora or Reddit threads where you genuinely help. One honest mention in a roundup beats ten paid links from nowhere.\n\n## How do you measure AI-referred traffic?\n\nBuild a GA4 segment for referrers containing perplexity.ai, chatgpt.com, copilot and gemini, and review it monthly. It will look small and convert disproportionately well, because the AI already pre-sold you.\n\nGoogle hides AI Overview clicks inside normal Search Console data, so watch queries where you hold position one but CTR keeps sliding. That is an Overview eating the click — and your cue to become its source.\n\nAnd put a how-did-you-hear-about-us field on every form. In 2026 it is the cheapest attribution tool you own.\n\n## Which GEO services are a waste of money?\n\nAny AI-search submission service, guaranteed ChatGPT listing, or proprietary GEO score is a waste — nobody can pay their way into an AI answer, and anyone guaranteeing one is guessing at best.\n\nSkip mass-produced AI content too. Publishing a hundred generic pages teaches the models exactly one thing about you: you are noise, not a source.\n\n## Where to start this week\n\nRewrite your five most important pages answer-first, add FAQ schema, and fix your name-address-phone consistency. One week of work, a long tail of citations.\n\nWant to know how liftable your site already is? Ask DigiSutra for the free 15-page website audit — delivered within 48 hours, AI-readability included.	SEO	{GEO,"AI Overviews","AI search"}	/blog/ai-overviews.jpg	PUBLISHED	2026-07-12 09:00:00	\N	3	GEO: How to Get Cited in Google AI Overviews (2026)	AI Overviews cite pages with answer-first copy, FAQ schema and third-party corroboration. Here's how to structure your site to get cited in AI search.	f	\N	DigiSutra Team	2026-07-12 11:46:38.618	2026-07-12 11:46:38.618
cmrhqa2zv0001t6xgguo3ofgc	WhatsApp marketing for SMBs: the four flows that pay in 2026	whatsapp-marketing-automation-smbs-2026	The four flows that pay, broadcast lists vs the API, in-chat UPI commerce, and what WhatsApp marketing really costs an SMB in 2026.	Your customers open WhatsApp messages in minutes. Your emails? Days, if at all. With more than 500 million Indians on the app, WhatsApp is not "a channel" anymore — for most SMBs, it is the channel.\n\nYet most small businesses still forward offer images from a personal number and call it marketing. In 2026 that caps your reach, risks a ban and leaves abandoned carts unrecovered.\n\n## Broadcast lists or the WhatsApp Business API?\n\nBroadcast lists suit micro-businesses; the WhatsApp Business Platform (the API) is what you need the moment you want automation, scale or a shared team inbox.\n\nThe free Business app caps broadcasts at 256 contacts, and people only receive them if they have saved your number. Workable for a boutique with 200 regulars, useless beyond that.\n\nThe API removes the contact cap, makes you eligible for verification, plugs into automation tools and lets a whole team reply from one number. Everything below assumes the API.\n\n## Which automated flows actually pay for themselves?\n\nFour flows deliver most of the revenue: welcome, abandoned checkout, reorder reminder and review request.\n\nThe welcome flow sends your catalog and a first-order nudge seconds after opt-in, while interest is hottest. The abandoned-checkout flow pings a cart reminder 30 to 60 minutes after drop-off — with open rates above 90 percent, it recovers orders email never will.\n\nIf you sell anything consumable — coffee, supplements, lenses — time a reorder nudge to the repurchase cycle: customers who reorder every 45 days get pinged on day 40. And a review request three days after delivery quietly compounds your ratings everywhere else.\n\n## Can customers actually buy inside WhatsApp?\n\nYes — in India a customer can browse your catalog, build a cart and pay by UPI without ever leaving the chat.\n\nThat is a shorter journey than most e-commerce checkouts manage. Catalogs are free to set up and turn every conversation into a storefront; fewer steps means fewer drop-offs, so treat the chat itself as your smallest, fastest sales page.\n\n## How do you stay out of WhatsApp spam jail?\n\nYou stay safe by messaging only genuine opt-ins, keeping promotional frequency low and checking your quality rating in Meta Business Manager weekly.\n\nMeta scores every business number on blocks and reports. Slip into the red and your daily messaging limit shrinks; keep slipping and the number is gone.\n\nNever buy lists. Never blast someone because they once enquired. Two to four promotional messages a month is plenty — flows triggered by the customer's own actions rarely get flagged.\n\n## What does WhatsApp automation realistically cost?\n\nFor a typical SMB, budget roughly Rs 3,000 to 10,000 a month for the platform, plus Meta's per-message fees — marketing templates in India run under a rupee each.\n\nService replies inside the 24-hour customer window are free, which is one more reason to design flows that get customers talking back. A few thousand rupees against recovered carts and repeat orders is one of the cleaner ROI equations in marketing right now.\n\n## Where should you start this week?\n\nStart with one flow — abandoned checkout if you sell online, review requests if you do not — and get it live before touching anything else.\n\nOne working flow beats a grand omnichannel plan sitting in a slide deck. Add the next flow only when the first is quietly making money.\n\nAnd if the website you are driving all this traffic to is the leak in the funnel, ask us for the free 15-page website audit — delivered in 48 hours, no strings.	Marketing	{"WhatsApp marketing","marketing automation","WhatsApp Business API"}	/blog/whatsapp-marketing.jpg	PUBLISHED	2026-07-11 09:00:00	\N	3	WhatsApp Marketing Automation for SMBs in 2026	WhatsApp marketing in 2026: use the Business API over broadcast lists, automate 4 revenue flows, sell via in-chat UPI, and stay under Meta's spam radar.	f	\N	DigiSutra Team	2026-07-12 11:46:38.635	2026-07-12 11:46:38.635
cmr9hgixu0008t6t8vgcudbkk	Lead generation in 2026: AI-assisted funnels	ai-assisted-lead-generation-2026	Speed-to-lead wins. How AI assistants, lead scoring and SMS/email nurture flows turn ad clicks into qualified pipeline.	Most funnels don't fail at the ad — they fail in the follow-up. Leads arrive, sit in an inbox, and go cold before anyone replies. In 2026, the agencies winning on cost per lead are the ones letting AI run the first mile of the conversation.\n\n## Where leads actually leak\n\nSpeed-to-lead is still the strongest predictor of conversion: reply within five minutes and you are several times more likely to qualify the lead than at thirty. Yet most businesses average hours. The second leak is qualification — sales teams burning time on leads that were never a fit.\n\n## The AI-assisted funnel\n\nThe fix is a simple pipeline: capture from every channel (forms, WhatsApp, Instagram, missed calls), respond instantly with an AI assistant that asks the two or three qualifying questions, score the answers, and route hot leads to a human with full context. Everything else drips into an email and SMS nurture sequence until it warms up.\n\n## What to measure\n\nTrack speed-to-first-touch, qualified rate, and cost per qualified lead — not raw lead volume. When the AI handles the first mile, teams typically see reply times drop from hours to seconds and sales conversations start twice as warm.\n\n## Where to start\n\nBegin with one channel (WhatsApp is usually highest-intent in India), one qualifying script, and one nurture sequence. Expand only after the numbers prove out. If you want the audit-first version of this, our free website audit maps exactly where your funnel leaks today.	Marketing	{lead-generation,ai-funnels}	/blog/lead-generation.jpg	PUBLISHED	2026-07-06 17:17:33.281	\N	4	Lead generation in 2026: AI-assisted funnels	Speed-to-lead wins. How AI assistants, lead scoring and SMS/email nurture flows turn ad clicks into qualified pipeline.	f	cmr92cikh0003t6cky1knny6c	SEO One	2026-07-06 17:17:33.283	2026-07-12 11:46:38.638
\.


--
-- Data for Name: BugReport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BugReport" (id, "pageId", title, description, severity, status, "screenshotUrl", "reportedById", "reportedByName", "resolvedById", "resolvedByName", "resolvedAt", "createdAt") FROM stdin;
cmr9fqwdv000kt68w89f8wza6	cmr9fqsrq0005t68w6s0kif3j	CTA overlaps footer on mobile	375px viewport: the CTA band overlaps the footer wordmark.	HIGH	RESOLVED	https://example.com/shot.png	cmr92ciav0002t6ckbbqnn7w4	QA One	cmr92ci1j0001t6ck3cn60p6l	Dev One	2026-07-06 16:29:41.488	2026-07-06 16:29:38.036
\.


--
-- Data for Name: Form; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Form" (id, name, slug, fields, "notifyEmail", "isActive", "createdAt", "updatedAt") FROM stdin;
cmr9hgixx0009t6t8tctysxir	Lead form	lead-form	[{"key": "name", "type": "text", "label": "Name", "options": [], "required": true}, {"key": "email", "type": "email", "label": "Email", "options": [], "required": true}, {"key": "service", "type": "select", "label": "Service", "options": ["Digital Marketing", "Development", "AI Solutions"], "required": false}, {"key": "message", "type": "textarea", "label": "Message", "options": [], "required": true}]	\N	t	2026-07-06 17:17:33.286	2026-07-06 23:15:07.646
\.


--
-- Data for Name: FormSubmission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FormSubmission" (id, "formId", data, ip, "createdAt") FROM stdin;
cmr9hher80001t6m4r34jdrql	cmr9hgixx0009t6t8tctysxir	{"name": "Form Tester", "email": "ft@test.com", "message": "Testing the embedded form pipeline.", "service": "Development"}	::1	2026-07-06 17:18:14.516
\.


--
-- Data for Name: MediaAsset; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MediaAsset" (id, filename, "originalName", "mimeType", size, width, height, alt, url, "uploadedById", "uploadedByName", "createdAt") FROM stdin;
cmr9hhylk0007t6m404xv8xq8	db89d3319237f4ae9620.webp	test-cover.png	image/webp	5590	800	450	DigiSutra brand test image	/uploads/db89d3319237f4ae9620.webp	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 17:18:40.232
cmr9pjeok0006t624sp04wijr	90ff64ce1d3934b1499f.webp	harden-test.png	image/webp	84	100	100		/uploads/90ff64ce1d3934b1499f.webp	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 21:03:44.661
\.


--
-- Data for Name: NewsletterSubscriber; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NewsletterSubscriber" (id, email, source, "createdAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, "userId", type, title, body, link, "readAt", "createdAt") FROM stdin;
cmr9fqv02000dt68wv9uzhc1u	cmr92ciav0002t6ckbbqnn7w4	workflow	"Workflow Demo Page" submitted for testing	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:36.242
cmr9fqv02000et68wah9f0nwq	cmr92chs50000t6cklv6m3y9t	workflow	"Workflow Demo Page" submitted for testing	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:36.242
cmr9fqwem000nt68wge8co5c5	cmr92chs50000t6cklv6m3y9t	bug	Bug (high): CTA overlaps footer on mobile	On "Workflow Demo Page" — 375px viewport: the CTA band overlaps the footer wordmark.	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:38.063
cmr9fqwem000ot68wsivwqnz7	cmr92ci1j0001t6ck3cn60p6l	bug	Bug (high): CTA overlaps footer on mobile	On "Workflow Demo Page" — 375px viewport: the CTA band overlaps the footer wordmark.	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:38.063
cmr9fqwhg000tt68wtztqsds0	cmr92chs50000t6cklv6m3y9t	workflow	Testing failed: "Workflow Demo Page"	Mobile layout broken, see bug report.	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:38.164
cmr9fqwhg000ut68w0gl3xktv	cmr92ci1j0001t6ck3cn60p6l	workflow	Testing failed: "Workflow Demo Page"	Mobile layout broken, see bug report.	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:38.164
cmr9fqy020013t68w9jv4jd24	cmr92cikh0003t6cky1knny6c	comment	Dev One commented on "Workflow Demo Page"	Fixed the overlap — padding added below CTA.	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:40.13
cmr9fqy020014t68wdg8okd4h	cmr92chs50000t6cklv6m3y9t	comment	Dev One commented on "Workflow Demo Page"	Fixed the overlap — padding added below CTA.	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:40.13
cmr9fqy020015t68wosq29alz	cmr92ciav0002t6ckbbqnn7w4	comment	Dev One commented on "Workflow Demo Page"	Fixed the overlap — padding added below CTA.	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:40.13
cmr9fqz210017t68whpmornxp	cmr92ciav0002t6ckbbqnn7w4	bug	Bug resolved: CTA overlaps footer on mobile	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:41.497
cmr9fqz4y001dt68wcb6ld3c4	cmr92chs50000t6cklv6m3y9t	workflow	"Workflow Demo Page" submitted for testing	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:41.602
cmr9fqz4y001et68wdo4p1y62	cmr92ciav0002t6ckbbqnn7w4	workflow	"Workflow Demo Page" submitted for testing	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:41.602
cmr9fqzox001nt68wj3x1ejel	cmr92cikh0003t6cky1knny6c	workflow	"Workflow Demo Page" passed testing — SEO review next	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:42.321
cmr9fqzox001ot68woio03ifn	cmr92chs50000t6cklv6m3y9t	workflow	"Workflow Demo Page" passed testing — SEO review next	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:42.321
cmr9fr0a5001xt68wo1m6h83s	cmr92chs50000t6cklv6m3y9t	workflow	SEO review complete: "Workflow Demo Page" awaits approval	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:43.085
cmr9fr0qb0026t68wotdjx7jm	cmr92ci1j0001t6ck3cn60p6l	workflow	Publish approved: "Workflow Demo Page"	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:43.667
cmr9fr0qb0027t68w4hsmitrl	cmr92cikh0003t6cky1knny6c	workflow	Publish approved: "Workflow Demo Page"	\N	/admin/pages/cmr9fqsrq0005t68w6s0kif3j	\N	2026-07-06 16:29:43.667
cmrl6mvr4000ct6sstf9saubm	cmr92cikh0003t6cky1knny6c	comment.submitted	New review awaiting approval on "Stop mourning clicks: how to get cited in AI Overviews"	E2E Tester · 5★: Set up the GA4 segment from this guide - AI referrals were already visible. Eye-opening.	/admin/comments	\N	2026-07-14 21:47:48.16
cmrl6mvr4000dt6ssfmq9ausr	cmr92chs50000t6cklv6m3y9t	comment.submitted	New review awaiting approval on "Stop mourning clicks: how to get cited in AI Overviews"	E2E Tester · 5★: Set up the GA4 segment from this guide - AI referrals were already visible. Eye-opening.	/admin/comments	\N	2026-07-14 21:47:48.16
cmr9hherg0002t6m4bl86ombm	cmr92chs50000t6cklv6m3y9t	form	New "Lead form" submission	Name: Form Tester\nEmail: ft@test.com\nService: Development\nMessage: Testing the embedded form pipeline.	/admin/forms	2026-07-14 22:16:02.971	2026-07-06 17:18:14.525
\.


--
-- Data for Name: Page; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Page" (id, title, slug, status, sections, "seoTitle", "seoDescription", "canonicalUrl", "ogImage", "noIndex", "schemaJson", "publishedAt", "scheduledAt", "createdById", "updatedById", "createdAt", "updatedAt", "workflowStage") FROM stdin;
cmr9fqsrq0005t68w6s0kif3j	Workflow Demo Page	workflow-demo	DRAFT	[]	\N	\N	\N	\N	f	\N	2026-07-06 16:29:43.728	\N	cmr92ci1j0001t6ck3cn60p6l	cmr92chs50000t6cklv6m3y9t	2026-07-06 16:29:33.349	2026-07-06 16:30:20.064	APPROVED
cmr9e48l40005t6m0ni8n61e8	Digital Marketing Services	digital-marketing-services	PUBLISHED	[{"copy": "Full-funnel growth programs measured in revenue — search, paid media and CRO run by one accountable team.", "type": "hero", "ctaHref": "/#contact", "eyebrow": "Digital marketing", "heading": "SEO that compounds,", "ctaLabel": "Get a free audit ↗", "highlight": "ads that convert"}, {"type": "cards", "items": [{"copy": "Site speed, crawlability, structured data and Core Web Vitals fixed at the source.", "title": "Technical SEO"}, {"copy": "Keyword-mapped articles and landing pages written for people, optimized for engines.", "title": "Content engine"}, {"copy": "Google and Meta campaigns with weekly optimization against your cost-per-acquisition targets.", "title": "Paid media"}], "heading": "What's included"}, {"type": "stats", "items": [{"label": "avg. organic growth", "value": "+248%"}, {"label": "average ROAS", "value": "5.8×"}, {"label": "to first results", "value": "90d"}, {"label": "clients served", "value": "120+"}]}, {"type": "faq", "items": [{"a": "Technical fixes show impact within 4–6 weeks; compounding traffic growth typically starts from month 3.", "q": "How soon can we expect SEO results?"}, {"a": "No — programs run month-to-month and can be paused with 30 days' notice.", "q": "Do you require long contracts?"}], "heading": "Frequently asked questions"}, {"copy": "Get a free 15-page audit of your SEO, ads and site speed.", "type": "cta", "ctaHref": "/#contact", "heading": "Ready to grow?", "ctaLabel": "Claim your audit"}, {"type": "video", "heading": "Watch how we work", "videoSlug": "getting-started-with-digisutra"}]	Digital Marketing Services — SEO, PPC & CRO	Full-funnel digital marketing by DigiSutra: technical SEO, content, Google & Meta ads and CRO — measured in revenue, not vanity metrics.	\N	\N	f	\N	2026-07-06 16:30:04.984	\N	cmr92chs50000t6cklv6m3y9t	cmr92chs50000t6cklv6m3y9t	2026-07-06 15:44:01.143	2026-07-06 20:13:19.693	DRAFT
cmr9rfo17000ct67o4eg5spij	About Us	about	PUBLISHED	[{"copy": "Founded in 2018, DigiSutra pairs marketing strategists with product engineers so clients never have to coordinate two agencies again.", "type": "hero", "ctaHref": "/#contact", "eyebrow": "About us", "heading": "One team.", "ctaLabel": "Work with us ↗", "highlight": "Every growth lever."}, {"body": "Most businesses hire a marketing agency and a development shop, then spend their energy refereeing between the two. Campaigns launch before the landing pages are ready. Sites ship that nobody can rank. The ERP never talks to the ad account.\\n\\nWe built DigiSutra to end that split. Our strategists and engineers sit in the same standups, share the same dashboards, and answer to the same number: your revenue.", "type": "richText", "heading": "Why we exist"}, {"type": "stats", "items": [{"label": "founded", "value": "2018"}, {"label": "projects shipped", "value": "250+"}, {"label": "happy clients", "value": "120+"}, {"label": "countries served", "value": "12"}]}, {"type": "cards", "items": [{"copy": "We commit to numbers — traffic, leads, revenue — not activity reports. Every engagement starts by agreeing what success measurably looks like.", "title": "Outcome first"}, {"copy": "Fixed quotes, live dashboards, and honest post-mortems when something doesn't work. You always know what we did and what it cost.", "title": "Radical transparency"}, {"copy": "MVPs in weeks, weekly demos, small increments. Momentum beats perfection, and real user data beats every internal debate.", "title": "Ship fast, iterate"}], "heading": "What we stand for"}, {"copy": "Tell us where you want to grow — we'll bring the plan.", "type": "cta", "ctaHref": "/#contact", "heading": "Let's write your next chapter", "ctaLabel": "Get free consultation"}]	About Us — Your Growth, Our Sutra	DigiSutra Solutions pairs marketing strategists with product engineers — SEO, ads, web, ERP and AI under one accountable roof, serving clients across 12 countries.	\N	\N	f	\N	2026-07-06 21:56:49.386	\N	cmr92chs50000t6cklv6m3y9t	cmr92chs50000t6cklv6m3y9t	2026-07-06 21:56:49.387	2026-07-06 22:04:28.628	APPROVED
cmr9rfo1i000ft67oa1mkwoyg	Careers	careers	PUBLISHED	[{"copy": "Remote-first, small teams, real ownership. We hire people who like shipping more than they like meetings.", "type": "hero", "ctaHref": "mailto:careers@digisutra.com", "eyebrow": "Careers", "heading": "Do the best work", "ctaLabel": "Send your resume ↗", "highlight": "of your career"}, {"type": "cards", "items": [{"copy": "Work from anywhere in India with overlap hours; we meet in person once a quarter.", "title": "Remote-first"}, {"copy": "Small pods own accounts and products end to end — no ticket factories.", "title": "Real ownership"}, {"copy": "Annual budget for courses, certifications and conferences, plus dedicated learning Fridays.", "title": "Learning budget"}], "heading": "What you get"}, {"body": "One short intro call, one practical exercise drawn from real (anonymized) client work, one conversation with the team you'd join. No whiteboard hazing, and we always tell you where you stand within a week.\\n\\nWe hire on demonstrated craft over credentials. If you've shipped things you're proud of — campaigns, codebases, designs — we want to see them.", "type": "richText", "heading": "How we hire"}, {"type": "faq", "items": [{"a": "SEO and paid-media specialists, full-stack developers (Next.js/Laravel), Flutter developers, and UI/UX designers. Send a resume even if there's no exact opening — we hire opportunistically for strong people.", "q": "Which roles do you hire for?"}, {"a": "Yes, remote-first across India, with a quarterly team meetup and core overlap hours of 11:00–17:00 IST.", "q": "Is the work fully remote?"}, {"a": "Typically two weeks from first call to offer. We respect your time and never leave candidates hanging.", "q": "How fast is the process?"}], "heading": "Common questions"}, {"copy": "Strong generalists always have a seat. Introduce yourself.", "type": "cta", "ctaHref": "mailto:careers@digisutra.com", "heading": "Don't see your role?", "ctaLabel": "careers@digisutra.com"}]	Careers — Join the Team	Join a remote-first team of marketers and engineers who ship. Openings across SEO, paid media, full-stack development and design.	\N	\N	f	\N	2026-07-06 21:56:49.396	\N	cmr92chs50000t6cklv6m3y9t	cmr92chs50000t6cklv6m3y9t	2026-07-06 21:56:49.398	2026-07-06 22:04:28.737	APPROVED
cmr9rfo1r000lt67o41ls6wc6	Terms & Conditions	terms	PUBLISHED	[{"copy": "Last updated: July 2026. Using this website or engaging our services means you accept these terms.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Terms & Conditions", "ctaLabel": "", "highlight": ""}, {"body": "Every engagement is defined by a written proposal covering scope, deliverables, timeline and fees. Work outside the agreed scope is quoted separately before we begin it.\\n\\nEstimates for marketing outcomes (rankings, traffic, lead volume) are projections based on experience, not guarantees — no honest agency can promise a specific position on a platform it doesn't control.", "type": "richText", "heading": "Services and proposals"}, {"body": "Development projects are invoiced against milestones; marketing retainers are invoiced monthly in advance. Invoices are payable within 14 days.\\n\\nWe may pause work on accounts more than 30 days overdue after written notice.", "type": "richText", "heading": "Payment"}, {"body": "On full payment, you own the deliverables we create for you — code, designs, and content. We retain ownership of our pre-existing tools, frameworks and internal libraries, which you receive a perpetual license to use within the deliverables.\\n\\nWe may reference completed work in our portfolio unless you request otherwise in writing.", "type": "richText", "heading": "Intellectual property"}, {"body": "Our aggregate liability under any engagement is limited to the fees paid for that engagement in the preceding six months. We are not liable for indirect or consequential losses, or for the actions of third-party platforms (search engines, ad networks, app stores) outside our control.\\n\\nThese terms are governed by the laws of India; disputes fall under the jurisdiction of the courts of our registered office.", "type": "richText", "heading": "Liability"}]	Terms & Conditions	The terms that govern use of the DigiSutra Solutions website and engagement of our services.	\N	\N	f	\N	2026-07-06 21:56:49.405	\N	cmr92chs50000t6cklv6m3y9t	cmr92chs50000t6cklv6m3y9t	2026-07-06 21:56:49.407	2026-07-06 22:04:28.851	APPROVED
cmr9rfo1u000ot67o792tn1i2	Refund Policy	refund-policy	PUBLISHED	[{"copy": "Last updated: July 2026. Plainly: pay only for work delivered.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Refund Policy", "ctaLabel": "", "highlight": ""}, {"body": "Milestone payments cover completed, delivered milestones and are non-refundable once you have accepted the milestone. If you cancel a project mid-milestone, we invoice only the portion of work completed and refund any unearned balance of that milestone within 14 days.", "type": "richText", "heading": "Development projects"}, {"body": "Retainers may be cancelled with 30 days' written notice. The notice month is worked and billed as normal; any month paid beyond the notice period is refunded in full.\\n\\nMedia budgets (Google, Meta, etc.) are paid to the platforms directly and follow those platforms' refund rules, not ours.", "type": "richText", "heading": "Marketing retainers"}, {"body": "Completed and accepted work, third-party costs incurred on your behalf (licenses, stock assets, ad spend), and discovery or audit engagements once the findings have been delivered.\\n\\nIf something has genuinely gone wrong, talk to us first — we would rather fix it than argue about it. Write to billing@digisutra.com.", "type": "richText", "heading": "What we don't refund"}]	Refund Policy	When and how DigiSutra Solutions issues refunds for services.	\N	\N	f	\N	2026-07-06 21:56:49.408	\N	cmr92chs50000t6cklv6m3y9t	cmr92chs50000t6cklv6m3y9t	2026-07-06 21:56:49.41	2026-07-06 22:04:28.9	APPROVED
cmr9rfo1n000it67ou892j76k	Privacy Policy	privacy-policy	PUBLISHED	[{"copy": "Last updated: July 2026. This policy explains what we collect, why, and the choices you have.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Privacy Policy", "ctaLabel": "", "highlight": ""}, {"body": "When you contact us or submit a form, we collect the details you provide: name, company, email, phone number, and your message. Our website records anonymous, cookie-less page-view statistics (the page visited and the referring site) that contain no personal identifiers.\\n\\nWe do not use advertising trackers on this site, and we do not buy, sell, or trade personal data.", "type": "richText", "heading": "What we collect"}, {"body": "Contact details are used solely to respond to your enquiry and, where you engage us, to deliver our services and invoices. Aggregate site statistics help us understand which content is useful.\\n\\nWe retain enquiry data for up to 24 months, and client records for as long as required by Indian tax and accounting law.", "type": "richText", "heading": "How we use it"}, {"body": "We share data only with the service providers needed to operate: our hosting provider, our email delivery provider, and — for clients — the advertising and analytics platforms you authorize us to manage on your behalf. Each processor is bound by its own data-protection terms.\\n\\nWe never disclose your information to third parties for their marketing.", "type": "richText", "heading": "Sharing and processors"}, {"body": "You may request a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it (subject to legal retention requirements). Write to privacy@digisutra.com and we will respond within 30 days.\\n\\nThis policy is governed by the laws of India, including the Digital Personal Data Protection Act, 2023.", "type": "richText", "heading": "Your rights"}, {"copy": "We answer privacy requests within 30 days.", "type": "cta", "ctaHref": "mailto:privacy@digisutra.com", "heading": "Questions about your data?", "ctaLabel": "privacy@digisutra.com"}]	Privacy Policy	How DigiSutra Solutions collects, uses and protects your personal information.	\N	\N	f	\N	2026-07-06 21:56:49.402	\N	cmr92chs50000t6cklv6m3y9t	cmr92chs50000t6cklv6m3y9t	2026-07-06 21:56:49.404	2026-07-06 22:04:28.801	APPROVED
cmr9rfo1x000rt67oirw5h80u	Cookie Policy	cookie-policy	PUBLISHED	[{"copy": "Last updated: July 2026. The short version: this site is nearly cookie-free by design.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Cookie Policy", "ctaLabel": "", "highlight": ""}, {"body": "Our public website sets no advertising or analytics cookies. Page-view statistics are collected with a cookie-less, first-party method that stores no identifier on your device.\\n\\nThe only cookies this site sets are strictly-necessary session cookies for team members signed in to our content management system — visitors never receive them.", "type": "richText", "heading": "What we use"}, {"body": "Some pages embed videos from YouTube or Vimeo. We use privacy-enhanced embeds where available (youtube-nocookie.com), but playing an embedded video may cause the video platform to set its own cookies under its own policy.", "type": "richText", "heading": "Embedded content"}, {"body": "Because we set no optional cookies, there is nothing to opt out of on our side. You can control or delete cookies from embedded platforms through your browser settings at any time.", "type": "richText", "heading": "Managing cookies"}]	Cookie Policy	What cookies the DigiSutra Solutions website uses — spoiler: almost none.	\N	\N	f	\N	2026-07-06 21:56:49.412	\N	cmr92chs50000t6cklv6m3y9t	cmr92chs50000t6cklv6m3y9t	2026-07-06 21:56:49.413	2026-07-06 22:04:28.949	APPROVED
\.


--
-- Data for Name: PageComment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PageComment" (id, "pageId", body, "stageAtTime", "authorId", "authorName", "createdAt") FROM stdin;
cmr9fqxzm0010t68w3hzo6s3i	cmr9fqsrq0005t68w6s0kif3j	Fixed the overlap — padding added below CTA.	DRAFT	cmr92ci1j0001t6ck3cn60p6l	Dev One	2026-07-06 16:29:40.115
\.


--
-- Data for Name: PageVersion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PageVersion" (id, "pageId", version, title, sections, "seoSnapshot", note, "createdById", "createdByName", "createdAt") FROM stdin;
cmr9e48l40006t6m084e6p12s	cmr9e48l40005t6m0ni8n61e8	1	Digital Marketing Services	[{"copy": "Full-funnel growth programs measured in revenue — search, paid media and CRO run by one accountable team.", "type": "hero", "ctaHref": "/#contact", "eyebrow": "Digital marketing", "heading": "SEO that compounds,", "ctaLabel": "Get a free audit ↗", "highlight": "ads that convert"}, {"type": "cards", "items": [{"copy": "Site speed, crawlability, structured data and Core Web Vitals fixed at the source.", "title": "Technical SEO"}, {"copy": "Keyword-mapped articles and landing pages written for people, optimized for engines.", "title": "Content engine"}, {"copy": "Google and Meta campaigns with weekly optimization against your cost-per-acquisition targets.", "title": "Paid media"}], "heading": "What's included"}, {"type": "stats", "items": [{"label": "avg. organic growth", "value": "+248%"}, {"label": "average ROAS", "value": "5.8×"}, {"label": "to first results", "value": "90d"}, {"label": "clients served", "value": "120+"}]}, {"type": "faq", "items": [{"a": "Technical fixes show impact within 4–6 weeks; compounding traffic growth typically starts from month 3.", "q": "How soon can we expect SEO results?"}, {"a": "No — programs run month-to-month and can be paused with 30 days' notice.", "q": "Do you require long contracts?"}], "heading": "Frequently asked questions"}, {"copy": "Get a free 15-page audit of your SEO, ads and site speed.", "type": "cta", "ctaHref": "/#contact", "heading": "Ready to grow?", "ctaLabel": "Claim your audit"}]	{}	Seeded	\N	Seed	2026-07-06 15:44:01.143
cmr9e6cmw0005t6x426m31ssp	cmr9e48l40005t6m0ni8n61e8	2	Digital Marketing Services	[{"copy": "Edited via CMS API test.", "type": "hero", "ctaHref": "/#contact", "eyebrow": "Digital marketing", "heading": "SEO that compounds,", "ctaLabel": "Get a free audit", "highlight": "ads that print"}]	{"noIndex": false, "ogImage": null, "seoTitle": "Digital Marketing Services — SEO, PPC & CRO", "canonicalUrl": null, "seoDescription": "Full-funnel digital marketing by DigiSutra: technical SEO, content, Google & Meta ads and CRO — measured in revenue, not vanity metrics."}	API edit test	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 15:45:39.704
cmr9e6dkr0009t6x4g27djp6h	cmr9e48l40005t6m0ni8n61e8	3	Digital Marketing Services	[{"copy": "Full-funnel growth programs measured in revenue — search, paid media and CRO run by one accountable team.", "type": "hero", "ctaHref": "/#contact", "eyebrow": "Digital marketing", "heading": "SEO that compounds,", "ctaLabel": "Get a free audit ↗", "highlight": "ads that convert"}, {"type": "cards", "items": [{"copy": "Site speed, crawlability, structured data and Core Web Vitals fixed at the source.", "title": "Technical SEO"}, {"copy": "Keyword-mapped articles and landing pages written for people, optimized for engines.", "title": "Content engine"}, {"copy": "Google and Meta campaigns with weekly optimization against your cost-per-acquisition targets.", "title": "Paid media"}], "heading": "What's included"}, {"type": "stats", "items": [{"label": "avg. organic growth", "value": "+248%"}, {"label": "average ROAS", "value": "5.8×"}, {"label": "to first results", "value": "90d"}, {"label": "clients served", "value": "120+"}]}, {"type": "faq", "items": [{"a": "Technical fixes show impact within 4–6 weeks; compounding traffic growth typically starts from month 3.", "q": "How soon can we expect SEO results?"}, {"a": "No — programs run month-to-month and can be paused with 30 days' notice.", "q": "Do you require long contracts?"}], "heading": "Frequently asked questions"}, {"copy": "Get a free 15-page audit of your SEO, ads and site speed.", "type": "cta", "ctaHref": "/#contact", "heading": "Ready to grow?", "ctaLabel": "Claim your audit"}]	{}	Restored v1	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 15:45:40.924
cmr9fqsrq0006t68wry5gvjhp	cmr9fqsrq0005t68w6s0kif3j	1	Workflow Demo Page	[]	{}	Created	cmr92ci1j0001t6ck3cn60p6l	Dev One	2026-07-06 16:29:33.349
cmr9nqkmg000ct6s8mvaj17lj	cmr9e48l40005t6m0ni8n61e8	4	Digital Marketing Services	[{"copy": "Full-funnel growth programs measured in revenue — search, paid media and CRO run by one accountable team.", "type": "hero", "ctaHref": "/#contact", "eyebrow": "Digital marketing", "heading": "SEO that compounds,", "ctaLabel": "Get a free audit ↗", "highlight": "ads that convert"}, {"type": "cards", "items": [{"copy": "Site speed, crawlability, structured data and Core Web Vitals fixed at the source.", "title": "Technical SEO"}, {"copy": "Keyword-mapped articles and landing pages written for people, optimized for engines.", "title": "Content engine"}, {"copy": "Google and Meta campaigns with weekly optimization against your cost-per-acquisition targets.", "title": "Paid media"}], "heading": "What's included"}, {"type": "stats", "items": [{"label": "avg. organic growth", "value": "+248%"}, {"label": "average ROAS", "value": "5.8×"}, {"label": "to first results", "value": "90d"}, {"label": "clients served", "value": "120+"}]}, {"type": "faq", "items": [{"a": "Technical fixes show impact within 4–6 weeks; compounding traffic growth typically starts from month 3.", "q": "How soon can we expect SEO results?"}, {"a": "No — programs run month-to-month and can be paused with 30 days' notice.", "q": "Do you require long contracts?"}], "heading": "Frequently asked questions"}, {"copy": "Get a free 15-page audit of your SEO, ads and site speed.", "type": "cta", "ctaHref": "/#contact", "heading": "Ready to grow?", "ctaLabel": "Claim your audit"}, {"type": "video", "heading": "Watch how we work", "videoSlug": "getting-started-with-digisutra"}]	{"noIndex": false, "ogImage": null, "seoTitle": "Digital Marketing Services — SEO, PPC & CRO", "canonicalUrl": null, "seoDescription": "Full-funnel digital marketing by DigiSutra: technical SEO, content, Google & Meta ads and CRO — measured in revenue, not vanity metrics."}	Content edit	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 20:13:19.72
cmr9rfo17000dt67o5e11lf8e	cmr9rfo17000ct67o4eg5spij	1	About Us	[{"copy": "Founded in 2018, DigiSutra pairs marketing strategists with product engineers so clients never have to coordinate two agencies again.", "type": "hero", "ctaHref": "/#contact", "eyebrow": "About us", "heading": "One team.", "ctaLabel": "Work with us ↗", "highlight": "Every growth lever."}, {"body": "Most businesses hire a marketing agency and a development shop, then spend their energy refereeing between the two. Campaigns launch before the landing pages are ready. Sites ship that nobody can rank. The ERP never talks to the ad account.\\n\\nWe built DigiSutra to end that split. Our strategists and engineers sit in the same standups, share the same dashboards, and answer to the same number: your revenue.", "type": "richText", "heading": "Why we exist"}, {"type": "stats", "items": [{"label": "founded", "value": "2018"}, {"label": "projects shipped", "value": "250+"}, {"label": "happy clients", "value": "120+"}, {"label": "countries served", "value": "12"}]}, {"type": "cards", "items": [{"copy": "We commit to numbers — traffic, leads, revenue — not activity reports. Every engagement starts by agreeing what success measurably looks like.", "title": "Outcome first"}, {"copy": "Fixed quotes, live dashboards, and honest post-mortems when something doesn't work. You always know what we did and what it cost.", "title": "Radical transparency"}, {"copy": "MVPs in weeks, weekly demos, small increments. Momentum beats perfection, and real user data beats every internal debate.", "title": "Ship fast, iterate"}], "heading": "What we stand for"}, {"copy": "Tell us where you want to grow — we'll bring the plan.", "type": "cta", "ctaHref": "/#contact", "heading": "Let's write your next chapter", "ctaLabel": "Get free consultation"}]	{}	Seeded	\N	Seed	2026-07-06 21:56:49.387
cmr9rpie80009t640fqvulouq	cmr9rfo17000ct67o4eg5spij	2	About Us	[{"copy": "Founded in 2018, DigiSutra pairs marketing strategists with product engineers so clients never have to coordinate two agencies again.", "type": "hero", "ctaHref": "/#contact", "eyebrow": "About us", "heading": "One team.", "ctaLabel": "Work with us ↗", "highlight": "Every growth lever."}, {"body": "Most businesses hire a marketing agency and a development shop, then spend their energy refereeing between the two. Campaigns launch before the landing pages are ready. Sites ship that nobody can rank. The ERP never talks to the ad account.\\n\\nWe built DigiSutra to end that split. Our strategists and engineers sit in the same standups, share the same dashboards, and answer to the same number: your revenue.", "type": "richText", "heading": "Why we exist"}, {"type": "stats", "items": [{"label": "founded", "value": "2018"}, {"label": "projects shipped", "value": "250+"}, {"label": "happy clients", "value": "120+"}, {"label": "countries served", "value": "12"}]}, {"type": "cards", "items": [{"copy": "We commit to numbers — traffic, leads, revenue — not activity reports. Every engagement starts by agreeing what success measurably looks like.", "title": "Outcome first"}, {"copy": "Fixed quotes, live dashboards, and honest post-mortems when something doesn't work. You always know what we did and what it cost.", "title": "Radical transparency"}, {"copy": "MVPs in weeks, weekly demos, small increments. Momentum beats perfection, and real user data beats every internal debate.", "title": "Ship fast, iterate"}], "heading": "What we stand for"}, {"copy": "Tell us where you want to grow — we'll bring the plan.", "type": "cta", "ctaHref": "/#contact", "heading": "Let's write your next chapter", "ctaLabel": "Get free consultation"}]	{"noIndex": false, "ogImage": null, "seoTitle": "About Us — Your Growth, Our Sutra", "canonicalUrl": null, "seoDescription": "DigiSutra Solutions pairs marketing strategists with product engineers — SEO, ads, web, ERP and AI under one accountable roof, serving clients across 12 countries."}	SEO edit	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 22:04:28.641
cmr9rfo1i000gt67oxi3e6ukc	cmr9rfo1i000ft67oa1mkwoyg	1	Careers	[{"copy": "Remote-first, small teams, real ownership. We hire people who like shipping more than they like meetings.", "type": "hero", "ctaHref": "mailto:careers@digisutra.com", "eyebrow": "Careers", "heading": "Do the best work", "ctaLabel": "Send your resume ↗", "highlight": "of your career"}, {"type": "cards", "items": [{"copy": "Work from anywhere in India with overlap hours; we meet in person once a quarter.", "title": "Remote-first"}, {"copy": "Small pods own accounts and products end to end — no ticket factories.", "title": "Real ownership"}, {"copy": "Annual budget for courses, certifications and conferences, plus dedicated learning Fridays.", "title": "Learning budget"}], "heading": "What you get"}, {"body": "One short intro call, one practical exercise drawn from real (anonymized) client work, one conversation with the team you'd join. No whiteboard hazing, and we always tell you where you stand within a week.\\n\\nWe hire on demonstrated craft over credentials. If you've shipped things you're proud of — campaigns, codebases, designs — we want to see them.", "type": "richText", "heading": "How we hire"}, {"type": "faq", "items": [{"a": "SEO and paid-media specialists, full-stack developers (Next.js/Laravel), Flutter developers, and UI/UX designers. Send a resume even if there's no exact opening — we hire opportunistically for strong people.", "q": "Which roles do you hire for?"}, {"a": "Yes, remote-first across India, with a quarterly team meetup and core overlap hours of 11:00–17:00 IST.", "q": "Is the work fully remote?"}, {"a": "Typically two weeks from first call to offer. We respect your time and never leave candidates hanging.", "q": "How fast is the process?"}], "heading": "Common questions"}, {"copy": "Strong generalists always have a seat. Introduce yourself.", "type": "cta", "ctaHref": "mailto:careers@digisutra.com", "heading": "Don't see your role?", "ctaLabel": "careers@digisutra.com"}]	{}	Seeded	\N	Seed	2026-07-06 21:56:49.398
cmr9rfo1n000jt67ol0e1jph8	cmr9rfo1n000it67ou892j76k	1	Privacy Policy	[{"copy": "Last updated: July 2026. This policy explains what we collect, why, and the choices you have.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Privacy Policy", "ctaLabel": "", "highlight": ""}, {"body": "When you contact us or submit a form, we collect the details you provide: name, company, email, phone number, and your message. Our website records anonymous, cookie-less page-view statistics (the page visited and the referring site) that contain no personal identifiers.\\n\\nWe do not use advertising trackers on this site, and we do not buy, sell, or trade personal data.", "type": "richText", "heading": "What we collect"}, {"body": "Contact details are used solely to respond to your enquiry and, where you engage us, to deliver our services and invoices. Aggregate site statistics help us understand which content is useful.\\n\\nWe retain enquiry data for up to 24 months, and client records for as long as required by Indian tax and accounting law.", "type": "richText", "heading": "How we use it"}, {"body": "We share data only with the service providers needed to operate: our hosting provider, our email delivery provider, and — for clients — the advertising and analytics platforms you authorize us to manage on your behalf. Each processor is bound by its own data-protection terms.\\n\\nWe never disclose your information to third parties for their marketing.", "type": "richText", "heading": "Sharing and processors"}, {"body": "You may request a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it (subject to legal retention requirements). Write to privacy@digisutra.com and we will respond within 30 days.\\n\\nThis policy is governed by the laws of India, including the Digital Personal Data Protection Act, 2023.", "type": "richText", "heading": "Your rights"}, {"copy": "We answer privacy requests within 30 days.", "type": "cta", "ctaHref": "mailto:privacy@digisutra.com", "heading": "Questions about your data?", "ctaLabel": "privacy@digisutra.com"}]	{}	Seeded	\N	Seed	2026-07-06 21:56:49.404
cmr9rfo1r000mt67oqp1nqwu3	cmr9rfo1r000lt67o41ls6wc6	1	Terms & Conditions	[{"copy": "Last updated: July 2026. Using this website or engaging our services means you accept these terms.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Terms & Conditions", "ctaLabel": "", "highlight": ""}, {"body": "Every engagement is defined by a written proposal covering scope, deliverables, timeline and fees. Work outside the agreed scope is quoted separately before we begin it.\\n\\nEstimates for marketing outcomes (rankings, traffic, lead volume) are projections based on experience, not guarantees — no honest agency can promise a specific position on a platform it doesn't control.", "type": "richText", "heading": "Services and proposals"}, {"body": "Development projects are invoiced against milestones; marketing retainers are invoiced monthly in advance. Invoices are payable within 14 days.\\n\\nWe may pause work on accounts more than 30 days overdue after written notice.", "type": "richText", "heading": "Payment"}, {"body": "On full payment, you own the deliverables we create for you — code, designs, and content. We retain ownership of our pre-existing tools, frameworks and internal libraries, which you receive a perpetual license to use within the deliverables.\\n\\nWe may reference completed work in our portfolio unless you request otherwise in writing.", "type": "richText", "heading": "Intellectual property"}, {"body": "Our aggregate liability under any engagement is limited to the fees paid for that engagement in the preceding six months. We are not liable for indirect or consequential losses, or for the actions of third-party platforms (search engines, ad networks, app stores) outside our control.\\n\\nThese terms are governed by the laws of India; disputes fall under the jurisdiction of the courts of our registered office.", "type": "richText", "heading": "Liability"}]	{}	Seeded	\N	Seed	2026-07-06 21:56:49.407
cmr9rfo1u000pt67oaxe360ls	cmr9rfo1u000ot67o792tn1i2	1	Refund Policy	[{"copy": "Last updated: July 2026. Plainly: pay only for work delivered.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Refund Policy", "ctaLabel": "", "highlight": ""}, {"body": "Milestone payments cover completed, delivered milestones and are non-refundable once you have accepted the milestone. If you cancel a project mid-milestone, we invoice only the portion of work completed and refund any unearned balance of that milestone within 14 days.", "type": "richText", "heading": "Development projects"}, {"body": "Retainers may be cancelled with 30 days' written notice. The notice month is worked and billed as normal; any month paid beyond the notice period is refunded in full.\\n\\nMedia budgets (Google, Meta, etc.) are paid to the platforms directly and follow those platforms' refund rules, not ours.", "type": "richText", "heading": "Marketing retainers"}, {"body": "Completed and accepted work, third-party costs incurred on your behalf (licenses, stock assets, ad spend), and discovery or audit engagements once the findings have been delivered.\\n\\nIf something has genuinely gone wrong, talk to us first — we would rather fix it than argue about it. Write to billing@digisutra.com.", "type": "richText", "heading": "What we don't refund"}]	{}	Seeded	\N	Seed	2026-07-06 21:56:49.41
cmr9rfo1x000st67o5j5990na	cmr9rfo1x000rt67oirw5h80u	1	Cookie Policy	[{"copy": "Last updated: July 2026. The short version: this site is nearly cookie-free by design.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Cookie Policy", "ctaLabel": "", "highlight": ""}, {"body": "Our public website sets no advertising or analytics cookies. Page-view statistics are collected with a cookie-less, first-party method that stores no identifier on your device.\\n\\nThe only cookies this site sets are strictly-necessary session cookies for team members signed in to our content management system — visitors never receive them.", "type": "richText", "heading": "What we use"}, {"body": "Some pages embed videos from YouTube or Vimeo. We use privacy-enhanced embeds where available (youtube-nocookie.com), but playing an embedded video may cause the video platform to set its own cookies under its own policy.", "type": "richText", "heading": "Embedded content"}, {"body": "Because we set no optional cookies, there is nothing to opt out of on our side. You can control or delete cookies from embedded platforms through your browser settings at any time.", "type": "richText", "heading": "Managing cookies"}]	{}	Seeded	\N	Seed	2026-07-06 21:56:49.413
cmr9rpih7000dt640gpogp68k	cmr9rfo1i000ft67oa1mkwoyg	2	Careers	[{"copy": "Remote-first, small teams, real ownership. We hire people who like shipping more than they like meetings.", "type": "hero", "ctaHref": "mailto:careers@digisutra.com", "eyebrow": "Careers", "heading": "Do the best work", "ctaLabel": "Send your resume ↗", "highlight": "of your career"}, {"type": "cards", "items": [{"copy": "Work from anywhere in India with overlap hours; we meet in person once a quarter.", "title": "Remote-first"}, {"copy": "Small pods own accounts and products end to end — no ticket factories.", "title": "Real ownership"}, {"copy": "Annual budget for courses, certifications and conferences, plus dedicated learning Fridays.", "title": "Learning budget"}], "heading": "What you get"}, {"body": "One short intro call, one practical exercise drawn from real (anonymized) client work, one conversation with the team you'd join. No whiteboard hazing, and we always tell you where you stand within a week.\\n\\nWe hire on demonstrated craft over credentials. If you've shipped things you're proud of — campaigns, codebases, designs — we want to see them.", "type": "richText", "heading": "How we hire"}, {"type": "faq", "items": [{"a": "SEO and paid-media specialists, full-stack developers (Next.js/Laravel), Flutter developers, and UI/UX designers. Send a resume even if there's no exact opening — we hire opportunistically for strong people.", "q": "Which roles do you hire for?"}, {"a": "Yes, remote-first across India, with a quarterly team meetup and core overlap hours of 11:00–17:00 IST.", "q": "Is the work fully remote?"}, {"a": "Typically two weeks from first call to offer. We respect your time and never leave candidates hanging.", "q": "How fast is the process?"}], "heading": "Common questions"}, {"copy": "Strong generalists always have a seat. Introduce yourself.", "type": "cta", "ctaHref": "mailto:careers@digisutra.com", "heading": "Don't see your role?", "ctaLabel": "careers@digisutra.com"}]	{"noIndex": false, "ogImage": null, "seoTitle": "Careers — Join the Team", "canonicalUrl": null, "seoDescription": "Join a remote-first team of marketers and engineers who ship. Openings across SEO, paid media, full-stack development and design."}	SEO edit	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 22:04:28.747
cmr9rpiix000ht640on49wox6	cmr9rfo1n000it67ou892j76k	2	Privacy Policy	[{"copy": "Last updated: July 2026. This policy explains what we collect, why, and the choices you have.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Privacy Policy", "ctaLabel": "", "highlight": ""}, {"body": "When you contact us or submit a form, we collect the details you provide: name, company, email, phone number, and your message. Our website records anonymous, cookie-less page-view statistics (the page visited and the referring site) that contain no personal identifiers.\\n\\nWe do not use advertising trackers on this site, and we do not buy, sell, or trade personal data.", "type": "richText", "heading": "What we collect"}, {"body": "Contact details are used solely to respond to your enquiry and, where you engage us, to deliver our services and invoices. Aggregate site statistics help us understand which content is useful.\\n\\nWe retain enquiry data for up to 24 months, and client records for as long as required by Indian tax and accounting law.", "type": "richText", "heading": "How we use it"}, {"body": "We share data only with the service providers needed to operate: our hosting provider, our email delivery provider, and — for clients — the advertising and analytics platforms you authorize us to manage on your behalf. Each processor is bound by its own data-protection terms.\\n\\nWe never disclose your information to third parties for their marketing.", "type": "richText", "heading": "Sharing and processors"}, {"body": "You may request a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it (subject to legal retention requirements). Write to privacy@digisutra.com and we will respond within 30 days.\\n\\nThis policy is governed by the laws of India, including the Digital Personal Data Protection Act, 2023.", "type": "richText", "heading": "Your rights"}, {"copy": "We answer privacy requests within 30 days.", "type": "cta", "ctaHref": "mailto:privacy@digisutra.com", "heading": "Questions about your data?", "ctaLabel": "privacy@digisutra.com"}]	{"noIndex": false, "ogImage": null, "seoTitle": "Privacy Policy", "canonicalUrl": null, "seoDescription": "How DigiSutra Solutions collects, uses and protects your personal information."}	SEO edit	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 22:04:28.809
cmr9rpikb000lt640jnlr1r50	cmr9rfo1r000lt67o41ls6wc6	2	Terms & Conditions	[{"copy": "Last updated: July 2026. Using this website or engaging our services means you accept these terms.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Terms & Conditions", "ctaLabel": "", "highlight": ""}, {"body": "Every engagement is defined by a written proposal covering scope, deliverables, timeline and fees. Work outside the agreed scope is quoted separately before we begin it.\\n\\nEstimates for marketing outcomes (rankings, traffic, lead volume) are projections based on experience, not guarantees — no honest agency can promise a specific position on a platform it doesn't control.", "type": "richText", "heading": "Services and proposals"}, {"body": "Development projects are invoiced against milestones; marketing retainers are invoiced monthly in advance. Invoices are payable within 14 days.\\n\\nWe may pause work on accounts more than 30 days overdue after written notice.", "type": "richText", "heading": "Payment"}, {"body": "On full payment, you own the deliverables we create for you — code, designs, and content. We retain ownership of our pre-existing tools, frameworks and internal libraries, which you receive a perpetual license to use within the deliverables.\\n\\nWe may reference completed work in our portfolio unless you request otherwise in writing.", "type": "richText", "heading": "Intellectual property"}, {"body": "Our aggregate liability under any engagement is limited to the fees paid for that engagement in the preceding six months. We are not liable for indirect or consequential losses, or for the actions of third-party platforms (search engines, ad networks, app stores) outside our control.\\n\\nThese terms are governed by the laws of India; disputes fall under the jurisdiction of the courts of our registered office.", "type": "richText", "heading": "Liability"}]	{"noIndex": false, "ogImage": null, "seoTitle": "Terms & Conditions", "canonicalUrl": null, "seoDescription": "The terms that govern use of the DigiSutra Solutions website and engagement of our services."}	SEO edit	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 22:04:28.859
cmr9rpiln000pt640k3y0l3g2	cmr9rfo1u000ot67o792tn1i2	2	Refund Policy	[{"copy": "Last updated: July 2026. Plainly: pay only for work delivered.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Refund Policy", "ctaLabel": "", "highlight": ""}, {"body": "Milestone payments cover completed, delivered milestones and are non-refundable once you have accepted the milestone. If you cancel a project mid-milestone, we invoice only the portion of work completed and refund any unearned balance of that milestone within 14 days.", "type": "richText", "heading": "Development projects"}, {"body": "Retainers may be cancelled with 30 days' written notice. The notice month is worked and billed as normal; any month paid beyond the notice period is refunded in full.\\n\\nMedia budgets (Google, Meta, etc.) are paid to the platforms directly and follow those platforms' refund rules, not ours.", "type": "richText", "heading": "Marketing retainers"}, {"body": "Completed and accepted work, third-party costs incurred on your behalf (licenses, stock assets, ad spend), and discovery or audit engagements once the findings have been delivered.\\n\\nIf something has genuinely gone wrong, talk to us first — we would rather fix it than argue about it. Write to billing@digisutra.com.", "type": "richText", "heading": "What we don't refund"}]	{"noIndex": false, "ogImage": null, "seoTitle": "Refund Policy", "canonicalUrl": null, "seoDescription": "When and how DigiSutra Solutions issues refunds for services."}	SEO edit	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 22:04:28.907
cmr9rpin0000tt6400o4ciics	cmr9rfo1x000rt67oirw5h80u	2	Cookie Policy	[{"copy": "Last updated: July 2026. The short version: this site is nearly cookie-free by design.", "type": "hero", "ctaHref": "", "eyebrow": "Legal", "heading": "Cookie Policy", "ctaLabel": "", "highlight": ""}, {"body": "Our public website sets no advertising or analytics cookies. Page-view statistics are collected with a cookie-less, first-party method that stores no identifier on your device.\\n\\nThe only cookies this site sets are strictly-necessary session cookies for team members signed in to our content management system — visitors never receive them.", "type": "richText", "heading": "What we use"}, {"body": "Some pages embed videos from YouTube or Vimeo. We use privacy-enhanced embeds where available (youtube-nocookie.com), but playing an embedded video may cause the video platform to set its own cookies under its own policy.", "type": "richText", "heading": "Embedded content"}, {"body": "Because we set no optional cookies, there is nothing to opt out of on our side. You can control or delete cookies from embedded platforms through your browser settings at any time.", "type": "richText", "heading": "Managing cookies"}]	{"noIndex": false, "ogImage": null, "seoTitle": "Cookie Policy", "canonicalUrl": null, "seoDescription": "What cookies the DigiSutra Solutions website uses — spoiler: almost none."}	SEO edit	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 22:04:28.957
\.


--
-- Data for Name: PageView; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PageView" (id, path, referrer, "createdAt") FROM stdin;
cmr9npzrv0000t6s8fnosup14	/	www.google.com	2026-07-06 20:12:52.699
cmr9npzt20002t6s8e96l6rd5	/blog	www.google.com	2026-07-06 20:12:52.743
cmr9npzti0003t6s8qbnr93ln	/digital-marketing-services	www.google.com	2026-07-06 20:12:52.758
cmr9npzs10001t6s8jvarb2x7	/	\N	2026-07-06 20:12:52.706
cmr9nvpea0000t6qwcxbib6yt	/	\N	2026-07-06 20:17:19.186
cmr9o3e8i0001t6qwuoqpvvzr	/digital-marketing-services	\N	2026-07-06 20:23:17.97
cmr9o43kh0002t6qw7qdz4gw6	/	\N	2026-07-06 20:23:50.802
cmr9o4no40003t6qwtldoq19h	/work	\N	2026-07-06 20:24:16.852
cmr9o4oxd0004t6qwtglacjpq	/	\N	2026-07-06 20:24:18.481
cmr9o6a2d0000t6woufw9txoq	/	localhost:3100	2026-07-06 20:25:32.533
cmr9o6a3w0001t6wozakkvevg	/	localhost:3100	2026-07-06 20:25:32.588
cmr9pj8fd0000t624vs2vo0x2	/	localhost:3100	2026-07-06 21:03:36.553
cmr9pj8ml0001t624b7lof5m4	/	\N	2026-07-06 21:03:36.813
cmr9pjqd20009t6247lfy24dl	/	localhost:3100	2026-07-06 21:03:59.798
cmr9pm4sw0000t6goz8g673o2	/	localhost:3100	2026-07-06 21:05:51.824
cmr9pm7vn0001t6go1byqaesn	/	\N	2026-07-06 21:05:55.812
cmr9rbbqu0000t6406e3zs0fc	/	\N	2026-07-06 21:53:26.838
cmr9rbt3t0001t640gymtuvxz	/	localhost:3100	2026-07-06 21:53:49.337
cmr9rct9k0002t640lz0vozwz	/work	localhost:3100	2026-07-06 21:54:36.199
cmr9rcymx0003t640atyhjxx1	/	localhost:3100	2026-07-06 21:54:43.161
cmr9rpsu4000wt64083f7g083	/about	localhost:3100	2026-07-06 22:04:42.172
cmr9soolb0000t6f8dcci0mt1	/	\N	2026-07-06 22:31:49.629
cmr9sqsz20001t6f8x0j9m9og	/	localhost:3100	2026-07-06 22:33:28.622
cmr9sqtxl0002t6f8wfts7z2n	/	localhost:3100	2026-07-06 22:33:29.866
cmr9sqyuh0003t6f8jvfhsdif	/work	localhost:3100	2026-07-06 22:33:36.233
cmr9sr0fu0004t6f8tnjmi9fu	/	localhost:3100	2026-07-06 22:33:38.298
cmr9sri5k0005t6f8oj3zylbx	/privacy-policy	localhost:3100	2026-07-06 22:34:01.256
cmr9srq550006t6f8g0d7at8a	/	localhost:3100	2026-07-06 22:34:11.61
cmr9srskz0007t6f8bo5nzr8c	/about	localhost:3100	2026-07-06 22:34:14.771
cmr9srvt60008t6f8aodroc6u	/	localhost:3100	2026-07-06 22:34:18.954
cmr9t563v0009t6f85bpiigjy	/work	localhost:3100	2026-07-06 22:44:38.755
cmr9t57g1000at6f8y5ld82y8	/	localhost:3100	2026-07-06 22:44:40.562
cmr9u5suz000bt6f8je8t34rh	/	localhost:3100	2026-07-06 23:13:07.931
cmr9u6bga000et6f8zvkjotoa	/blog/erp-vs-spreadsheets-when-to-switch	\N	2026-07-06 23:13:32.027
cmr9u9ikr000ht6f849uqut5o	/workflow-demo	\N	2026-07-06 23:16:01.228
cmr9u9pmx000it6f8gkbxy0wr	/digital-marketing-services	\N	2026-07-06 23:16:10.377
cmr9uactk000jt6f8utqxomjr	/	\N	2026-07-06 23:16:40.424
cmr9uafqz000kt6f802rzek4n	/work	\N	2026-07-06 23:16:44.219
cmr9ucekr000lt6f8qu2uamzn	/work	\N	2026-07-06 23:18:16.01
cmrc3l2210000t69gldn732wa	/	\N	2026-07-08 13:12:28.583
cmrc3lfw50001t69g88qx7y46	/blog/erp-vs-spreadsheets-when-to-switch	localhost:3100	2026-07-08 13:12:46.513
cmrc3ljd50002t69g6fz58lct	/blog/erp-vs-spreadsheets-when-to-switch	localhost:3100	2026-07-08 13:12:51.017
cmrc3lm190003t69g7j458ecs	/	localhost:3100	2026-07-08 13:12:54.478
cmrc3osdf0006t69gycnlbjxc	/	localhost:3100	2026-07-08 13:15:22.659
cmrc3oxg70007t69g4iczmfro	/	localhost:3100	2026-07-08 13:15:29.237
cmrc3t7ne0008t69gj6w7e2rw	/	localhost:3100	2026-07-08 13:18:49.082
cmrc3w1qy0009t69gskcykajm	/	localhost:3100	2026-07-08 13:21:01.402
cmrc3w3lr000at69g9xb754c3	/work	localhost:3100	2026-07-08 13:21:03.808
cmrc3zgln000bt69gkud668d4	/	localhost:3100	2026-07-08 13:23:40.62
cmrc463is000et69giudzqnmy	/	localhost:3100	2026-07-08 13:28:50.26
cmrdrbtwo0000t6nwz0w76s6b	/	\N	2026-07-09 17:04:55.079
cmrdsu4li0001t6nw1my6lwql	/	localhost:3100	2026-07-09 17:47:08.358
cmrdsyqg30002t6nwun6kj4cz	/	localhost:3100	2026-07-09 17:50:43.3
cmrdszwn10003t6nww8r8f4cu	/	localhost:3100	2026-07-09 17:51:37.981
cmrdu6gfm0004t6nwq72elb6f	/	localhost:3100	2026-07-09 18:24:43.186
cmrdu8vxv0005t6nwz36htk3z	/	\N	2026-07-09 18:26:36.596
cmrdu9g870008t6nwg8dkfoly	/	\N	2026-07-09 18:27:02.887
cmrdulxso0009t6nwnug12zbb	/	\N	2026-07-09 18:36:45.528
cmrdun8x7000ct6nw2osg6wol	/work	\N	2026-07-09 18:37:46.602
cmrdwmcef000nt6nwcwj4uw5w	/	localhost:3100	2026-07-09 19:33:03.687
cmrdx1psi000qt6nwqrq47qv4	/	\N	2026-07-09 19:45:00.882
cmrdxycyk000xt6nwfbv7dhin	/	localhost:3100	2026-07-09 20:10:23.901
cmrdyeygl0010t6nwciy0agnj	/	\N	2026-07-09 20:23:18.262
cmrdz1um80015t6nw6b8dty3l	/	\N	2026-07-09 20:41:06.368
cmrdzoywj001at6nwbya5oh7w	/	localhost:3100	2026-07-09 20:59:05.011
cmrdzx5tx001bt6nwlqatcgzy	/	\N	2026-07-09 21:05:27.237
cmrdzydoy001ct6nwckrfomb3	/	\N	2026-07-09 21:06:23.98
cmre04e01001ft6nwd0e8ncj9	/contact	\N	2026-07-09 21:11:04.417
cmre04ggk001gt6nw3au4oi57	/payment	\N	2026-07-09 21:11:07.605
cmre04mlm001ht6nw5gzim27u	/	\N	2026-07-09 21:11:15.563
cmre0vp9g0000t6b4m31zng55	/	\N	2026-07-09 21:32:18.724
cmre0ws5n0001t6b4w1o2r3ep	/	localhost:3100	2026-07-09 21:33:09.131
cmre0yoga0002t6b4oe6djzwi	/	localhost:3100	2026-07-09 21:34:37.642
cmre1bn6f0003t6b4ecc99vln	/	localhost:3100	2026-07-09 21:44:42.519
cmre1fi630004t6b48yywwzbr	/	localhost:3100	2026-07-09 21:47:42.652
cmre1fi6c0005t6b4j1782u99	/	localhost:3100	2026-07-09 21:47:42.661
cmre1l0da0006t6b4j3qsut5f	/	localhost:3100	2026-07-09 21:51:59.518
cmre24ew20007t6b4wcduvn9u	/work	localhost:3100	2026-07-09 22:07:04.72
cmre28nm10008t6b4csuqz7ai	/	localhost:3100	2026-07-09 22:10:22.729
cmre2m7dh0009t6b42sv2znsg	/	localhost:3100	2026-07-09 22:20:54.869
cmre2nr9j000at6b43yyl8tc1	/pricing	localhost:3100	2026-07-09 22:22:07.303
cmre2ntcb000bt6b432pluqtm	/	localhost:3100	2026-07-09 22:22:09.996
cmre3uktf0000t6gsd7wy0vy3	/	\N	2026-07-09 22:55:25.155
cmre3we2e0001t6gspfe9avts	/	localhost:3100	2026-07-09 22:56:49.719
cmre4i1pb0002t6gsjy7euh6w	/	localhost:3100	2026-07-09 23:13:40.128
cmre4i1pj0003t6gs6h5f3chh	/	localhost:3100	2026-07-09 23:13:40.136
cmre4mt8v0004t6gs0bz8qkse	/	localhost:3100	2026-07-09 23:17:22.447
cmre4mtqz0005t6gsc3myxsdz	/	localhost:3100	2026-07-09 23:17:23.1
cmre4pdw00006t6gs8m3kwhnw	/	localhost:3100	2026-07-09 23:19:22.513
cmre514ve0007t6gsseg1n142	/blog	localhost:3100	2026-07-09 23:28:30.698
cmre516n70008t6gsld8xo7g4	/	localhost:3100	2026-07-09 23:28:32.995
cmre5awgc0009t6gs4bmv686k	/	localhost:3100	2026-07-09 23:36:06.348
cmre5bkl2000at6gs1tj8skyh	/	localhost:3100	2026-07-09 23:36:37.622
cmre5etnq000bt6gsu3089yp4	/	localhost:3100	2026-07-09 23:39:09.351
cmre5jyuv000ct6gshkkglgli	/	localhost:3100	2026-07-09 23:43:09.368
cmre5lfnq000dt6gs05ljge7h	/	localhost:3100	2026-07-09 23:44:17.799
cmre5np4f000et6gs6ppn0rzb	/	localhost:3100	2026-07-09 23:46:03.375
cmre5nqqm000ft6gsb8pvkkeq	/	localhost:3100	2026-07-09 23:46:05.47
cmre5nuue000gt6gspbc3pbhe	/	localhost:3100	2026-07-09 23:46:10.79
cmre5o1h3000ht6gsjist07ry	/	localhost:3100	2026-07-09 23:46:19.384
cmre5o3yd000it6gslqpfgud0	/	localhost:3100	2026-07-09 23:46:22.597
cmre5o9kb000jt6gsniy7tasi	/	localhost:3100	2026-07-09 23:46:29.867
cmre5qmwk000kt6gsndmps25p	/	localhost:3100	2026-07-09 23:48:20.468
cmre5qp80000lt6gsyq15u16e	/	localhost:3100	2026-07-09 23:48:23.472
cmre5r05t000mt6gs2bw5r6un	/	localhost:3100	2026-07-09 23:48:37.65
cmre5riat000nt6gsw8spx0w8	/	localhost:3100	2026-07-09 23:49:01.157
cmre665rm000ot6gs9c90tsg5	/	localhost:3100	2026-07-10 00:00:24.753
cmre667n4000pt6gsc33fquxk	/	localhost:3100	2026-07-10 00:00:27.184
cmre6p0lr000qt6gspgdvaxmy	/	localhost:3100	2026-07-10 00:15:04.528
cmre70dqx000rt6gsc9f5tqca	/contact	localhost:3100	2026-07-10 00:23:54.777
cmre70gyi000st6gstbg3ajh8	/	localhost:3100	2026-07-10 00:23:58.938
cmre77p93000tt6gs8cosprgp	/	localhost:3100	2026-07-10 00:29:36.279
cmre7cahp000ut6gsd381iwjg	/	localhost:3100	2026-07-10 00:33:10.429
cmre7cc23000vt6gswisn4y5b	/	localhost:3100	2026-07-10 00:33:12.459
cmre7cddi000wt6gsgn1a1fz8	/	localhost:3100	2026-07-10 00:33:14.167
cmre7dvcu000xt6gswts6i8z2	/	localhost:3100	2026-07-10 00:34:24.126
cmre7dxq2000yt6gswe8vdjcu	/	localhost:3100	2026-07-10 00:34:27.194
cmre7kelf000zt6gsrzozjszt	/	localhost:3100	2026-07-10 00:39:28.996
cmre7o4a80010t6gs8l9jtgsm	/work	localhost:3100	2026-07-10 00:42:22.253
cmre7off20011t6gseghy5zsg	/	localhost:3100	2026-07-10 00:42:36.687
cmre864sq0012t6gsjzyihi64	/	localhost:3100	2026-07-10 00:56:22.73
cmre8pnh10013t6gsux6vuimo	/	localhost:3100	2026-07-10 01:11:33.397
cmre8pnnm0014t6gs61gghla5	/	localhost:3100	2026-07-10 01:11:33.634
cmre9c45q0017t6gsj8bo9a0y	/	localhost:3100	2026-07-10 01:29:01.454
cmre9fp270018t6gslxcr5xmq	/	localhost:3100	2026-07-10 01:31:48.512
cmre9ntbo0019t6gsnkli3fve	/	localhost:3100	2026-07-10 01:38:07.285
cmrf23ohg0000t6jcunvjsl4o	/	\N	2026-07-10 14:54:16.756
cmrf3j0vg0001t6jck925ji00	/	localhost:3100	2026-07-10 15:34:12.268
cmrf4vs860000t6z8jnn1htdj	/	\N	2026-07-10 16:12:07.206
cmrf88k580000t6v4vtqp57y5	/	\N	2026-07-10 17:46:02.107
cmrf89v2u0001t6v43ohtlwk7	/	localhost:3100	2026-07-10 17:47:02.934
cmrf95wsd0002t6v4zakvdtyx	/	localhost:3100	2026-07-10 18:11:58.141
cmrfa8aiz0000t6b85ko1528l	/	\N	2026-07-10 18:41:48.875
cmrgfscjc0000t6g41cn5pqm6	/	localhost:3100	2026-07-11 14:05:08.856
cmrggncro0001t6g4eww74rac	/services	localhost:3100	2026-07-11 14:29:15.493
cmrggnf680002t6g4zad1a4tj	/	localhost:3100	2026-07-11 14:29:18.609
cmrggqjdu0003t6g4lanify20	/	localhost:3100	2026-07-11 14:31:44.034
cmrgifvk50006t6g40cuk15vc	/	localhost:3100	2026-07-11 15:19:25.829
cmrgj5z5k000bt6g42jnu80b6	/	localhost:3100	2026-07-11 15:39:43.544
cmrglqfp8000qt6g407dde3dm	/	localhost:3100	2026-07-11 16:51:37.341
cmrglrs1e000rt6g4vb3mgp3r	/	localhost:3100	2026-07-11 16:52:39.986
cmrglst86000st6g4iebqmqk0	/	localhost:3100	2026-07-11 16:53:28.182
cmrgmdvex000xt6g4cdly4j7t	/	localhost:3100	2026-07-11 17:09:50.793
cmrgmnq5u0010t6g4oz7k9c6x	/services	localhost:3100	2026-07-11 17:17:30.547
cmrgmt1hh0011t6g4w73wjndh	/	localhost:3100	2026-07-11 17:21:38.502
cmrgn1ay70014t6g44jlr8ynf	/	localhost:3100	2026-07-11 17:28:04.016
cmrgnncmz0017t6g4cxiqsutg	/	localhost:3100	2026-07-11 17:45:12.635
cmrgno3is0018t6g42629igq4	/blog/local-seo-2026-map-pack-playbook	localhost:3100	2026-07-11 17:45:47.476
cmrgnod0h0019t6g4hc0qxzhy	/	localhost:3100	2026-07-11 17:45:59.777
cmrgnotgm001at6g4e07pc7xs	/blog/ai-chatbots-that-convert	localhost:3100	2026-07-11 17:46:21.094
cmrgnp1mf001dt6g4rpylf8j3	/	localhost:3100	2026-07-11 17:46:31.671
cmrgntcvj001et6g46vmcbxjb	/	localhost:3100	2026-07-11 17:49:52.879
cmrgqqccy001vt6g41kzgfc29	/	\N	2026-07-11 19:11:31.09
cmrgqqsbt001wt6g454kvxwb2	/	\N	2026-07-11 19:11:51.785
cmrgse2ev0027t6g4c2ctq7qh	/	\N	2026-07-11 19:57:57.559
cmrgsfp9m0028t6g4ieveunks	/	\N	2026-07-11 19:59:13.835
cmrgsh3sa0029t6g45zeqw023	/	\N	2026-07-11 20:00:19.306
cmrgtg8c1002gt6g4ugtuoly9	/	localhost:3100	2026-07-11 20:27:38.162
cmrgtw5fl002jt6g4nkh1vonj	/	localhost:3100	2026-07-11 20:40:00.897
cmrgtzs91002kt6g4pejptn3h	/	\N	2026-07-11 20:42:50.437
cmrgu1ytw002lt6g4nhol4lcs	/	localhost:3100	2026-07-11 20:44:32.276
cmrgu98bu002ot6g4hqb2uzoe	/	\N	2026-07-11 20:50:11.179
cmrguzigt002tt6g40abygmxd	/	\N	2026-07-11 21:10:37.373
cmrgv5v9g002ut6g4pzqvcmi8	/	localhost:3100	2026-07-11 21:15:33.892
cmrgv6pjv002vt6g4vcv96z1d	/	localhost:3100	2026-07-11 21:16:13.147
cmrgw0jx30032t6g4xhliffwv	/pricing	localhost:3100	2026-07-11 21:39:25.527
cmrgw0lz50033t6g4l819zi8c	/career	localhost:3100	2026-07-11 21:39:28.193
cmrgw0u0x0034t6g4a4jygu1n	/about	localhost:3100	2026-07-11 21:39:38.625
cmrh0b40e003tt6g4vx5u2qo5	/	localhost:3100	2026-07-11 23:39:36.59
cmrhpk15v004at6g4hsczb726	/work	localhost:3100	2026-07-12 11:26:23.202
cmrhpk3ic004bt6g4q2u0e86r	/	localhost:3100	2026-07-12 11:26:26.245
cmrhpoeh9004ct6g4tgn3gck1	/	localhost:3100	2026-07-12 11:29:47.085
cmrhppvdq004dt6g41p2k8ff5	/	\N	2026-07-12 11:30:55.646
cmrhpuulf004et6g46mmrhhp0	/	\N	2026-07-12 11:34:47.907
cmrhpwpfc004ft6g4te3krz9a	/	localhost:3100	2026-07-12 11:36:14.52
cmrhqkt2e004kt6g4dl9ua54z	/	\N	2026-07-12 11:54:58.983
cmrhqkxbm004lt6g4gggjz2g0	/blog/get-cited-in-google-ai-overviews-geo	\N	2026-07-12 11:55:04.498
cmrhqpymv004ot6g4093xcl4j	/	localhost:3100	2026-07-12 11:58:59.479
cmrhqqmh8004pt6g4nc4vjvr6	/blog	localhost:3100	2026-07-12 11:59:30.381
cmrhqqprg004qt6g4b9e66kvw	/	localhost:3100	2026-07-12 11:59:34.636
cmrhqyfce004rt6g49ohlh7ze	/	localhost:3100	2026-07-12 12:05:34.382
cmrhqygii004st6g464u6op1z	/blog/whatsapp-marketing-automation-smbs-2026	localhost:3100	2026-07-12 12:05:35.899
cmrhqzfw6004tt6g471p55rlq	/	\N	2026-07-12 12:06:21.75
cmrhqzi5v004wt6g4xmw3ttui	/blog/get-cited-in-google-ai-overviews-geo	\N	2026-07-12 12:06:24.691
cmrhr1d9h004xt6g4esaggoc3	/	localhost:3100	2026-07-12 12:07:51.652
cmrht47p80058t6g4bl9vzjdq	/blog	localhost:3100	2026-07-12 13:06:03.645
cmrht4nj3005bt6g4mc3ldkx0	/blog/whatsapp-marketing-automation-smbs-2026	localhost:3100	2026-07-12 13:06:24.159
cmrht86hg005ct6g4dae3gdou	/blog	localhost:3100	2026-07-12 13:09:08.691
cmrht8ap2005dt6g4v5bwb8ew	/blog	localhost:3100	2026-07-12 13:09:14.15
cmrhtc3zp005et6g4rgbxvt7j	/	localhost:3100	2026-07-12 13:12:12.085
cmrhtqvti005ht6g4rjkdxv1v	/	\N	2026-07-12 13:23:41.333
cmrhtw26o005kt6g4yux4u99i	/	localhost:3100	2026-07-12 13:27:42.864
cmrhuif7q005nt6g4q2qu34h4	/	localhost:3100	2026-07-12 13:45:06.182
cmrhuife4005ot6g4wqvtueag	/	localhost:3100	2026-07-12 13:45:06.413
cmrhuk76i005rt6g4tobej3tz	/	localhost:3100	2026-07-12 13:46:29.082
cmrhuk7nf005st6g4tlpy9hnf	/	localhost:3100	2026-07-12 13:46:29.691
cmrhuv886005tt6g4hk0m1xka	/blog	\N	2026-07-12 13:55:03.652
cmrhuvarx005ut6g4a2zveby5	/blog/get-cited-in-google-ai-overviews-geo	\N	2026-07-12 13:55:06.958
cmrhuw1iq005vt6g4kqit9hdq	/blog	localhost:3100	2026-07-12 13:55:41.618
cmrhuwe31005yt6g4ttjaqd6e	/blog/category/marketing	localhost:3100	2026-07-12 13:55:57.902
cmrhuwg9l005zt6g475pc2yte	/blog/whatsapp-marketing-automation-smbs-2026	localhost:3100	2026-07-12 13:56:00.73
cmrhuwytv0060t6g42s2sg1mp	/	localhost:3100	2026-07-12 13:56:24.788
cmrhux0q10061t6g44kjxdcji	/blog/whatsapp-marketing-automation-smbs-2026	localhost:3100	2026-07-12 13:56:27.242
cmrhux1mp0062t6g4i5utetmv	/blog/category/marketing	localhost:3100	2026-07-12 13:56:28.417
cmrhux4wb0063t6g4vd6vfjis	/blog	localhost:3100	2026-07-12 13:56:32.651
cmrhux82y0064t6g4s827ai4s	/blog/category/ai	localhost:3100	2026-07-12 13:56:36.779
cmrhuxant0065t6g4nl95wmgw	/blog	localhost:3100	2026-07-12 13:56:40.121
cmrl0zcqc008it6g4dl2oi779	/blog	\N	2026-07-14 19:09:32.338
cmrl0zgt3008jt6g40asvq64p	/blog/category/seo	\N	2026-07-14 19:09:37.623
cmrl0zlsv008kt6g46xzh3qpp	/blog/get-cited-in-google-ai-overviews-geo	\N	2026-07-14 19:09:44.096
cmrl65dfb0000t6ss36a4c9uw	/	localhost:3100	2026-07-14 21:34:11.255
cmrl66n7g0001t6ss9oe409or	/blog	localhost:3100	2026-07-14 21:35:10.588
cmrl67csv0002t6sse46z3qts	/blog/category/marketing	localhost:3100	2026-07-14 21:35:43.76
cmrl67h4a0003t6sskf02qc6e	/blog	localhost:3100	2026-07-14 21:35:49.354
cmrl6en0d0006t6ss3jnhsky9	/blog	localhost:3100	2026-07-14 21:41:23.581
cmrl6epo40007t6sshc3ft6fp	/blog/get-cited-in-google-ai-overviews-geo	localhost:3100	2026-07-14 21:41:27.028
cmrl6qdru000kt6ss2rtdf9ns	/blog	\N	2026-07-14 21:50:31.483
cmrl6qga2000lt6ssv7trkgaf	/blog/get-cited-in-google-ai-overviews-geo	\N	2026-07-14 21:50:34.73
cmrl7k0a5000st6ssyn7a1fws	/blog/get-cited-in-google-ai-overviews-geo	localhost:3100	2026-07-14 22:13:33.677
cmrl7k9vj000tt6ss118rxcaw	/blog/get-cited-in-google-ai-overviews-geo	localhost:3100	2026-07-14 22:13:46.111
cmrl7kfh3000ut6ss3vjok6dq	/	localhost:3100	2026-07-14 22:13:53.367
cmrl7myry000xt6sspn01ygvr	/	localhost:3100	2026-07-14 22:15:51.694
\.


--
-- Data for Name: Redirect; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Redirect" (id, "fromPath", "toPath", permanent, "isActive", hits, "createdAt") FROM stdin;
cmr9nqgyr0008t6s8wrgivk3n	/old-services	/digital-marketing-services	t	t	1	2026-07-06 20:13:14.979
cmrc3kh4l0000t6f4h2930bkb	/terms-and-conditions	/terms	t	t	2	2026-07-08 13:12:01.459
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RefreshToken" (id, "tokenHash", "userId", "userAgent", ip, "expiresAt", "revokedAt", "createdAt") FROM stdin;
cmr92e93j0001t6is2dlcswrd	f7899a7170c7a27ccf30b191a4b85994d9617bd8c9732f36f6cbbdb55843946c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 10:15:52.953	2026-07-06 10:36:52.757	2026-07-06 10:15:52.97
cmr93595m0005t6isn9v6qsjb	0971c6fdf234af5df18a4546c0816bc0cccf54108ff55d66d9618ff05ffd0680	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 10:36:52.758	2026-07-06 10:37:51.191	2026-07-06 10:36:52.76
cmr936ikp0009t6isjwqj0m7p	04d1671f3ddde28973bc4ae2edffdf526af40a744d8e3490f744478f705d716c	cmr92ci1j0001t6ck3cn60p6l	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 10:37:51.624	\N	2026-07-06 10:37:51.625
cmr9e6beu0001t6x4a7tz0uzb	7aedce913bc7045bfd28c0e258b86fe1e441b2e1a21518b8c6263f940d6dba56	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 15:45:38.112	\N	2026-07-06 15:45:38.115
cmr9e6rms000it6x493osy3gk	683b057b0ced51ddecd7949a61dd9994e2dc0ba24a725464a3a331aeb468804d	cmr92cikh0003t6cky1knny6c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 15:45:59.139	\N	2026-07-06 15:45:59.141
cmr9e6sta000qt6x4b2i3vxlw	300536cd64365783ce6dd41742325bbf2bed3746af761175e41eb744da403a57	cmr92ciav0002t6ckbbqnn7w4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 15:46:00.669	\N	2026-07-06 15:46:00.671
cmr9e6t4r000ut6x4gpyc6xoq	2dc6297327488b11c9ff50e2cae9b3a782352993c06d2ece332583bc2487214c	cmr92ci1j0001t6ck3cn60p6l	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 15:46:01.082	\N	2026-07-06 15:46:01.084
cmr9e77nc0012t6x481x2r8wm	6df430f92cacb713b6e6f4415a7526ec3b2cd98c528ce8a31cf7d3adeade4bf2	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 15:46:19.894	\N	2026-07-06 15:46:19.896
cmr9dc9570001t67oq3abu7j7	4f6c2ba0277c6d51d12bcac4411438a42b12a77b61e5c7000b3ffb17220194a4	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-05 15:22:15.494	2026-07-06 15:50:15.091	2026-07-06 15:22:15.497
cmr9fqslq0001t68w2o9s5dy7	fb1a0e39fc21f08b65233c010f98cb230b2375b4d2e775f4dbcbf80608c23fa1	cmr92ci1j0001t6ck3cn60p6l	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 16:29:33.127	\N	2026-07-06 16:29:33.13
cmr9fqvdx000gt68w0rc755u8	1aeab20a457fd0051f21666638ec5c105b8c786716318e0611fdd9895fb03d3d	cmr92ciav0002t6ckbbqnn7w4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 16:29:36.739	\N	2026-07-06 16:29:36.742
cmr9fqwzx000wt68wbjkcwc64	a45c65769ee4992f5d7de696bb2a501db1b7cba25ab251787b81375be58ff6b6	cmr92ci1j0001t6ck3cn60p6l	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 16:29:38.827	\N	2026-07-06 16:29:38.829
cmr9fqzmw001gt68wyos3bo2j	697b6ebadbfe9d21a312dff536d7d8f070d0bc6e7aacc6ad4554ab81dcddfec2	cmr92ciav0002t6ckbbqnn7w4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 16:29:42.247	\N	2026-07-06 16:29:42.249
cmr9fr06r001qt68wvm9vlc2k	238c3059dd0985887d9fb45c5f98d4e074ae472d1c4132120ad6dd8fd76901a0	cmr92cikh0003t6cky1knny6c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 16:29:42.961	\N	2026-07-06 16:29:42.963
cmr9fr0oo001zt68wjtszzgs0	97d28222ec906e384fca79ba9693dcdc0c97f43b858305376032651a8ca3f9fc	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 16:29:43.607	\N	2026-07-06 16:29:43.608
cmr9ec94u0001t630ov7t702l	3f526918097e82e5e5cfec308c936dbe3f16f1fe844b5308cde243aae8f86364	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-05 15:50:15.091	2026-07-06 16:44:24.271	2026-07-06 15:50:15.101
cmr9hhx630004t6m4rf4ikor1	93c864ac467933065d64ecca81f4546208e4b1d7d1e70ed3944396156e5027ac	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 17:18:38.378	\N	2026-07-06 17:18:38.379
cmr9hi061000bt6m4286a2jdi	e24a1a8aa00b39503821e6d455b5e9dda538a29544ecf803147f22d0578b512c	cmr92ci1j0001t6ck3cn60p6l	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 17:18:42.264	\N	2026-07-06 17:18:42.266
cmr9hi0wi000ft6m4m8vm94ri	c1ef13ceaf29e5ea4beb08ab234f9ee7874d7160de0377a9c2200d09440823a9	cmr92ciav0002t6ckbbqnn7w4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 17:18:43.216	\N	2026-07-06 17:18:43.218
cmr9hi1bm000jt6m41qi8x86x	33c0c8beb9b9da8b239a3604db1887d328b0d00978ed1cf4c01a5259dae66c61	cmr92cikh0003t6cky1knny6c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 17:18:43.76	\N	2026-07-06 17:18:43.762
cmr9g9w7p0001t63c91n988iv	b71129ca016cc5658bfcb1a89b198b8d6177d4201c8ac568445ef344d2264dbf	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-05 16:44:24.271	2026-07-06 21:03:11.469	2026-07-06 16:44:24.276
cmr9nqgg20005t6s8gaj3g7rf	e0edf9d176ba3b1aac79aa7362866cf6754244c18b11d4bca817576b966f76bc	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 20:13:14.298	\N	2026-07-06 20:13:14.306
cmr9nqlfu000gt6s8dnmp9t30	171c581fb4198fdc40c6fb597d52e74e3376b4fa04afbbd259db1a7fa88965dc	cmr92ciav0002t6ckbbqnn7w4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 20:13:20.773	\N	2026-07-06 20:13:20.779
cmr9nqx3g000kt6s8aahvj4h6	8416f5c79d34e3962492512353e3f91a89bc35421dd3b2e0d1b4c8a5ced76afe	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 20:13:35.88	\N	2026-07-06 20:13:35.885
cmr9pjd4u0003t624rrj572oz	a817e1019386785239afa848d70e371c5a8d077178060eb7fb5adf3453263dd7	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::ffff:127.0.0.1	2026-08-05 21:03:42.652	\N	2026-07-06 21:03:42.654
cmr9pip330003t6wo8rjnbsuj	5a4b59fcd3aced5b7dffba1a000cc16633fe0bfd41555670e3e205fab69061bf	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-05 21:03:11.47	2026-07-06 21:15:52.029	2026-07-06 21:03:11.48
cmr9pyzxm0003t6golz44bjvr	bf432496c8ad16cab3b481edcc47d6596cf837d6c0d77b8e9119228b6bb5db8c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-05 21:15:52.029	2026-07-06 21:25:51.877	2026-07-06 21:15:52.036
cmr9qburu0005t6gowusdx0ja	57f95b49444163a8ffbbd21c42f20f79690e3f362593429c900198536b5b1c0c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-05 21:25:51.877	2026-07-06 21:35:51.875	2026-07-06 21:25:51.881
cmr9rphb50005t64025a84wxb	9479c35b3a334f53be5a2a04e123197a3cf45f9965a33ff964ff7620025ed8f4	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.18286.0 Chrome/148.0.7778.271 Electron/42.5.1 Safari/537.36 MSIX	::1	2026-08-05 22:04:27.229	\N	2026-07-06 22:04:27.233
cmr9qopqg0007t6gogk4gmqqo	600258c36d3677c02db70ba3ccdb2356678a6b53767f8e156af9f262e757aeea	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-05 21:35:51.875	2026-07-06 23:13:10.558	2026-07-06 21:35:51.88
cmr9u5uwc000dt6f826qnem6m	4af58524c39142c5657dbcdd22030b71258067b75b40fc1e8bb7784987c6a068	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-05 23:13:10.558	2026-07-08 13:15:01.986	2026-07-06 23:13:10.566
cmrc3ocfs0005t69gwjqr6oat	1122ad35cadaf6d91d361e5331518d1d02e17ef9c48fdfd8e5fab70754a4aa6f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-07 13:15:01.986	2026-07-08 13:25:03.985	2026-07-08 13:15:01.997
cmrc418xi000dt69gmewcs3f9	39961db604d017f71a987961fdb82d380bdb863a9b3aa8f8295d6bdf7cd5f2ff	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-07 13:25:03.985	2026-07-08 13:35:03.895	2026-07-08 13:25:03.99
cmrc4e3tp000gt69gggnpe66l	fc1edbfaf05da45a33b7bb3a3583d5ad2fc9b7d4e3d7977f4aee2c5a94446dbc	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-07 13:35:03.896	2026-07-08 13:45:03.895	2026-07-08 13:35:03.9
cmrc4qysk000it69gvmc0yxdj	9cc64b6c5fa1c878efec99b2d38e0fbe1ef196050f85c6031c4317064ba6f212	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-07 13:45:03.895	2026-07-08 13:55:03.874	2026-07-08 13:45:03.908
cmrc53tqf000kt69gtalqvjjn	448a28a64c6778b640d8d6b6ba11a551437d5fccd37f6fba4b07c9dcb2b5cbf1	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-07 13:55:03.874	2026-07-08 14:05:03.887	2026-07-08 13:55:03.878
cmrc5gopd000mt69gefzrvriw	6eb23c746cc2839d5cb5e6325b29356cfff565f35fa802f9c9d8ef034b024bc6	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-07 14:05:03.887	2026-07-08 14:15:04.077	2026-07-08 14:05:03.889
cmrc5tjtc000ot69gnhl7vqvb	5e64918ba30d934abb0ca428ac45715b1a090d1e95436deadc739cb8d7742736	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-07 14:15:04.077	2026-07-08 14:25:03.934	2026-07-08 14:15:04.08
cmrc66eo2000qt69g9yxjoymu	12b9218cac0e8ce4bf5234c09b3f237338908d00d72856773364759f693a948a	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-07 14:25:03.934	2026-07-09 18:26:43.994	2026-07-08 14:25:03.938
cmrdu91ph0007t6nwtw6764dh	25a3a43049646cb233a8b0d7dab122a6cbe4657439b28f34a1bc724851796e6a	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 18:26:43.994	2026-07-09 18:36:46.998	2026-07-09 18:26:44.038
cmrdulyxq000bt6nwz9hzdmb1	99aa055c2a48afc378696c7a6b15beb6f273747de828631b0c31a6edc36f9983	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 18:36:46.998	2026-07-09 18:46:46.871	2026-07-09 18:36:47.005
cmrduytsq000et6nwx14dcjzk	bc15fa037f586d3ae8ac33a30bb38d397f0ff6f2430321636f6ff442afa3cde9	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 18:46:46.871	2026-07-09 18:56:46.907	2026-07-09 18:46:46.874
cmrdvbosj000gt6nwl85cm9lp	bf54eefb8e113472142263a4153313a76229a7d65abe8fc83e34fc7ef5622c43	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 18:56:46.907	2026-07-09 19:06:46.894	2026-07-09 18:56:46.913
cmrdvojqq000it6nwwkbykyat	7682b8640ed374e5b415e3d2e4ef30cc7534349e57b3e964f2a7ca59de63803e	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 19:06:46.894	2026-07-09 19:16:46.913	2026-07-09 19:06:46.897
cmrdw1epy000kt6nwzce9rphp	6d060d6adea8e0d1afec9470542c04858e55ade2a39d729525cb6884bf31cedf	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 19:16:46.913	2026-07-09 19:26:46.899	2026-07-09 19:16:46.917
cmrdwe9o5000mt6nwaznjbs5o	70bfbe7f453edbc43134c570e112c6ca1da10ab86bdfb350d8f9627503f24d60	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 19:26:46.899	2026-07-09 19:37:21.933	2026-07-09 19:26:46.901
cmrdwrvo1000pt6nwm39vjucn	1cbdc96813b22dcf603a1acacb4aecbb159c98a8006ce18cc8175d328da611f8	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 19:37:21.933	2026-07-09 19:47:21.893	2026-07-09 19:37:21.937
cmrdx4qll000st6nwklxmfmz6	0859aff2a57dbf0725c59c5992b1ed648b2d3b18bee87595c8622eccf11c802b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 19:47:21.893	2026-07-09 19:57:22.04	2026-07-09 19:47:21.896
cmrdxhlof000ut6nw5jz25o8l	14eab808799bcfc02dade8d5661cd571155ac067f4624b66b74fc61a65a03a04	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 19:57:22.04	2026-07-09 20:07:21.955	2026-07-09 19:57:22.046
cmrdxugkq000wt6nwgl2c63xy	ecf36a13ebea87608d8dd3af332137a3200d9a81c660cad081df7020b703f480	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 20:07:21.955	2026-07-09 20:17:21.959	2026-07-09 20:07:21.961
cmrdy7bjk000zt6nwufgdkswt	5be2007156158e5cfd2530d25f6684c00922d837a52e7ae7a973612767658b53	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 20:17:21.959	2026-07-09 20:27:22.005	2026-07-09 20:17:21.967
cmrdyk6jc0012t6nw6e57a7q1	b9539926a9070aa1c59593034082cded42dc84be93922bbb1ff3c99864cd58cb	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 20:27:22.005	2026-07-09 20:37:21.954	2026-07-09 20:27:22.007
cmrdyx1go0014t6nwrwz1p96r	5059cc74f1f588c880e0caa8845c8af6349692811e5a72cd0cc4957100587d20	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 20:37:21.954	2026-07-09 20:47:21.928	2026-07-09 20:37:21.96
cmrdz9wej0017t6nw5i5vz5z5	3b2a27df8de34eab82a80609ad5d771091c4409f2be30f42258e7b4248d555e9	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 20:47:21.928	2026-07-09 20:57:21.973	2026-07-09 20:47:21.93
cmrdzmrei0019t6nw65zskmzt	049aa422635277f6b1be62d201ee799b60d85c154bace937ace10cf6cea3ed63	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 20:57:21.973	2026-07-09 21:06:46.913	2026-07-09 20:57:21.978
cmrdzyvbb001et6nwh7rxg9qx	7426971f13fc78a5026a5ae510fc6908b5b79089b5b85f8e9a41c5dbbcc03141	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 21:06:46.913	2026-07-09 21:17:21.978	2026-07-09 21:06:46.917
cmre0chc2001jt6nwxe09qq88	0898e170a6be44430372d31d02779e8d2f068f91dfc54b44520aeec2db99e0d7	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 21:17:21.979	2026-07-09 21:27:21.934	2026-07-09 21:17:21.985
cmre0pc9g001lt6nwua1aqct6	abcb0f415b9c73ba80e12bb1c27f92ee30bee64d5bc6527745c1bdaceeadae5d	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-08 21:27:21.934	2026-07-10 01:28:59.409	2026-07-09 21:27:21.939
cmre9c2lg0016t6gsf8z3t432	01c0d8ac92f6a66f652d1ecc49c077b89e1473395d3db12cbbd2e1524913e10e	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-09 01:28:59.41	2026-07-10 01:39:01.895	2026-07-10 01:28:59.42
cmre9ozgs001bt6gs61a5pghe	a26e8570d83546150f1e2ddb63859ac0d1a36fee0b0fee16f6c0cb9a0c9bb4fb	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-09 01:39:01.895	2026-07-10 01:49:01.957	2026-07-10 01:39:01.899
cmrea1uh5001dt6gs5r72r6pw	73d5251c39b40776bc0b0a0d0c129d1ff5b40d83add2b3a3603377c79d447211	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-09 01:49:01.957	2026-07-10 01:59:01.892	2026-07-10 01:49:01.96
cmreaepe1001ft6gsywpyi5k0	ab50d1e0feb7d6f9d23d8e3a49240a130ad92730c7a567f5f4c10c08e5b8c31c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-09 01:59:01.892	2026-07-10 02:09:01.902	2026-07-10 01:59:01.896
cmrearkdc001ht6gse2oukbo9	3e0c0ad799fa92d48799aec67c0c3a0cab404650afd56615ed349e973905cd37	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-09 02:09:01.903	2026-07-11 15:15:23.434	2026-07-10 02:09:01.919
cmrgiaojn0005t6g4mbrxuju9	d35abc4d5725c36e7c65cecb2a3144f829c5b7c75dda87b440a51270772b64c8	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 15:15:23.435	2026-07-11 15:25:25.094	2026-07-11 15:15:23.446
cmrginkrz0008t6g49i7csejo	359f6f90226aaf56ee2abb31384ce9775b76fc0830ccbb8d2dcbdaa738b452a5	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 15:25:25.095	2026-07-11 15:35:25.086	2026-07-11 15:25:25.102
cmrgj0fqc000at6g4mh6zwmm7	580257ff286e2e5167a0c274758ec162558ebe4990932bc0635e7d65c8987dd7	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 15:35:25.086	2026-07-11 15:45:25.098	2026-07-11 15:35:25.09
cmrgjdape000dt6g4xnnm2kz3	6e58e1afe516f0f3d923c33602fd663639bb3c49b1b567691c8f5cd412e6d7da	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 15:45:25.099	2026-07-11 15:55:25.092	2026-07-11 15:45:25.102
cmrgjq5ns000ft6g4dcchtokf	a0b4b2fbe7ba8c9ec7bbab74147c4ace6b4eab6a25be3fb5876ab3e6bcba205b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 15:55:25.092	2026-07-11 16:05:25.101	2026-07-11 15:55:25.096
cmrgk30mp000ht6g4uwx7j4n9	cf06da751702cefee741ad026cbdb12f89fa63449195cc6c99a598e926c40ebc	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 16:05:25.102	2026-07-11 16:15:25.254	2026-07-11 16:05:25.105
cmrgkfvpr000jt6g44g8ftxmz	6972a225ab6fcafddf6fd902d7e78d0d22f9ccd0b98ce6157011beeca3b50e8f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 16:15:25.254	2026-07-11 16:26:23.147	2026-07-11 16:15:25.261
cmrgktzcl000lt6g4m01jxqg7	229260c818427716232afbf5f4700646230499edc5e48a6c1a50a1316de0ba56	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 16:26:23.148	2026-07-11 16:36:23.123	2026-07-11 16:26:23.155
cmrgl6uag000nt6g41jqbvb4i	1be4713e2eb6e8f15245a82d3b3d6109f6e9f063a22b5eb70c48388d7838f087	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 16:36:23.123	2026-07-11 16:46:23.13	2026-07-11 16:36:23.127
cmrgljp9g000pt6g4hk2d6bk6	bafe476f7703ed102a55638fa081a772f96bb74bda05ea5cbbc42f43c9873e6c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 16:46:23.131	2026-07-11 16:56:23.213	2026-07-11 16:46:23.137
cmrglwkai000ut6g4b4ouugd4	9b7c3e1efea24c97425fb7ff37d1da32abade14a3760207d0c28d705821f9d54	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 16:56:23.213	2026-07-11 17:06:23.129	2026-07-11 16:56:23.224
cmrgm9f6s000wt6g4m2p50grh	2191bd1f958c8d913e4f0256d93e68aa3130faa7cb53bb0f6f140f03091bb913	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 17:06:23.13	2026-07-11 17:16:23.152	2026-07-11 17:06:23.137
cmrgmma5x000zt6g4tmmeslql	f36ffebe57b09f3e7b6caf2476fc842ca4c5862c4545d91ddf7b0f85c0077b92	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 17:16:23.152	2026-07-11 17:26:21.745	2026-07-11 17:16:23.155
cmrgmz41k0013t6g46i4hhkcx	f12b0de64f55d2f41f88ac6890090e74cf3a7cced338e4e085f2f2c318a0ae2d	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 17:26:21.746	2026-07-11 17:35:25.178	2026-07-11 17:26:21.751
cmrgnardd0016t6g4h4hf8vhm	fc54ca6f089735012e180e9ff0cf4d76f427ebdcfe456181ad6bb0345c4e9bff	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 17:35:25.179	2026-07-11 17:46:23.188	2026-07-11 17:35:25.193
cmrgnov37001ct6g4h77jkifu	7d9dd2e9d11a394e628397e2eba121622f95423402d1eb3cabc3b2f7098faf87	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 17:46:23.189	2026-07-11 17:56:23.198	2026-07-11 17:46:23.199
cmrgo1q1z001gt6g45vp6i42j	89452c274fa82f01c757b80e0cab2c819508205d4a58457ce468c1effc0f9a7d	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 17:56:23.199	2026-07-11 18:06:23.082	2026-07-11 17:56:23.207
cmrgoekxb001it6g4hqms075r	2483f665b0259c9f5240a44a349530e54ea0a56261e7fef20956610477a9e4d6	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 18:06:23.082	2026-07-11 18:16:23.112	2026-07-11 18:06:23.086
cmrgorfwt001kt6g49qjfiami	9bbcea63d69091f3814fe9584b90245faa69900a4323f325cde50fdb04f3002f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 18:16:23.112	2026-07-11 18:26:23.119	2026-07-11 18:16:23.116
cmrgp4avq001mt6g4i0efms44	aa66bfb7ddef3e15b0e9421f95c6be663e38e486b0b26da53c67f5332883e065	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 18:26:23.12	2026-07-11 18:36:23.115	2026-07-11 18:26:23.125
cmrgph5ub001ot6g49xjou4ni	b723fd22a3fb2750b74b58031abb9d57277a286e6796fa29dd86eb9687343743	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 18:36:23.116	2026-07-11 18:46:23.118	2026-07-11 18:36:23.122
cmrgpu0tc001qt6g4wpzzk4qk	fb495f2ccb9a350af719d1b1995c27101de9423ace8c20791854cde1d1a3270d	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 18:46:23.118	2026-07-11 18:56:23.129	2026-07-11 18:46:23.135
cmrgq6vs1001st6g4nz5tbii6	69199fe2b2eeec58508f4378b60d80d5eb3dcc1797c2af17a9afa4d2c98ed272	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 18:56:23.13	2026-07-11 19:06:23.083	2026-07-11 18:56:23.136
cmrgqjqpc001ut6g4j8sdjnlv	a2e6085d5abfe3f7d02e29fd2bef019f92a041325918dd7048dd9f1580268491	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 19:06:23.083	2026-07-11 19:16:23.12	2026-07-11 19:06:23.088
cmrgqwlp4001yt6g461nk8rpi	f8092a18e8876e2f130730807b985e91f3329cf6e628f1692c5ae912043bbfed	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 19:16:23.121	2026-07-11 19:26:23.096	2026-07-11 19:16:23.127
cmrgr9gn40020t6g4jg4mhqoa	749b978dae180744eba2cbc625a8e9ae3e4b4503244ca8dd12c10861644c1ac9	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 19:26:23.096	2026-07-11 19:36:23.098	2026-07-11 19:26:23.103
cmrgrmblu0022t6g48yxhm7w2	be719362cfbf74a79c3b08b29b8848212eed1f1fef64e7731fddb990816fd286	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 19:36:23.099	2026-07-11 19:46:23.116	2026-07-11 19:36:23.105
cmrgrz6ky0024t6g4qqfjgr9l	97772cffee9097eaeb3fd64221bf9990f3b7f90f833c954c5cffc072c2b4864e	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 19:46:23.117	2026-07-11 19:56:23.137	2026-07-11 19:46:23.121
cmrgsc1k60026t6g4l1nr3vms	253d81714c23265045791c09b67f22eb09ef78df58da2c96a53c750496a256f8	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 19:56:23.137	2026-07-11 20:06:23.097	2026-07-11 19:56:23.141
cmrgsowhq002bt6g49v2nqlr3	aa39237473009bfed0f481d6444e85d03d64c1da25546be44ffc80f8ea348ccf	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 20:06:23.097	2026-07-11 20:16:06.266	2026-07-11 20:06:23.101
cmrgt1egw002dt6g4f37vvusf	d46c5f0a87f734c79b16aa63e3d8ec0a5363383df480eb490931e40f01898d1a	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 20:16:06.266	2026-07-11 20:26:23.267	2026-07-11 20:16:06.271
cmrgtemju002ft6g40aotnu65	fbb10d58eb206c0e501575740162a00165c21902ed1a9ab2e6d3cb983939dbdd	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 20:26:23.268	2026-07-11 20:35:58.701	2026-07-11 20:26:23.273
cmrgtqyk0002it6g4rmy2njmq	0ac55d55803d624ff60060490c560a1f89807a7f79dd56a57a5d80a401066d9f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 20:35:58.701	2026-07-11 20:46:23.168	2026-07-11 20:35:58.704
cmrgu4cee002nt6g4e7100874	6262707a59ab46f954d89c12607a2f359d084296e4c7172d5d67f216068d23a4	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 20:46:23.168	2026-07-11 20:56:23.158	2026-07-11 20:46:23.172
cmrguh7cr002qt6g4yo2lgrrv	86b2c689796997e4907ce264800f79e6abe2d201c10799fe9da5e43265a99479	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 20:56:23.159	2026-07-11 21:05:51.39	2026-07-11 20:56:23.162
cmrgutdsy002st6g4bjdufm0o	9ceda52470424e90cb529ded64db41dffe24a8e5f8018bf43c5a10f4ca2b591e	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 21:05:51.39	2026-07-11 21:16:23.238	2026-07-11 21:05:51.393
cmrgv6xck002xt6g4v55wckk0	5040e56b7091416c0a7172187fc8d1216e0e99537ff7dd9b0fe4ef8b6bc43036	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 21:16:23.238	2026-07-11 21:26:23.082	2026-07-11 21:16:23.246
cmrgvjs6m002zt6g4cuyl03cz	111f7eb9cfb6b4c7de24d654a5cb6e7d7178c74038ddb90f3ca2784294f54f33	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 21:26:23.083	2026-07-11 21:36:23.087	2026-07-11 21:26:23.086
cmrgvwn5e0031t6g41wbljwsy	67b518573d153397785c2b1a00f2b9a6d92fa2ba6718154efd1a6a58ec20de8f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 21:36:23.087	2026-07-11 21:46:23.095	2026-07-11 21:36:23.09
cmrgw9i4k0036t6g4hffi2dci	7c368d8c58e435fe9695fa721a0305d3574475ee6dfb61d3e75327acd60f087b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 21:46:23.096	2026-07-11 21:56:23.129	2026-07-11 21:46:23.107
cmrgwmd4g0038t6g4afnqppm8	b539dd26d457c7eaddc5aa3bf6799c017dfa186b8b96d746378196c2e1f559b4	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 21:56:23.129	2026-07-11 22:06:23.157	2026-07-11 21:56:23.149
cmrgwz83f003at6g4lxblhkey	eb1c7a00ed221b2d3cd77f475da7e26ec924aacb4975d6b8a5038ca2a01a533d	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 22:06:23.157	2026-07-11 22:16:23.123	2026-07-11 22:06:23.162
cmrgxc318003ct6g48fnfx1q3	ee1dc5078b3141e70876990e6e6c264b224ed3485eb3d4244f98d0fb2993312f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 22:16:23.124	2026-07-11 22:26:23.086	2026-07-11 22:16:23.13
cmrgxoxyr003et6g47n7h0815	fd72c6eb20d34b761b76076f55f22eba4e12eb9221806c475b8ae726fb0ccce1	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 22:26:23.086	2026-07-11 22:36:23.145	2026-07-11 22:26:23.09
cmrgy1sz2003gt6g4b5oqz5cb	1761afee2f99fde267512765684244d57717aefcb56b82f17f07c92031e9ab8f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 22:36:23.145	2026-07-11 22:46:23.152	2026-07-11 22:36:23.149
cmrgyenxz003it6g4d51xvk4q	8131c903163b5043b746366262269289e969dd3d9b4e4fd3454b3a7af3df0ead	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 22:46:23.152	2026-07-11 22:56:23.132	2026-07-11 22:46:23.159
cmrgyriw0003kt6g4q1sgblzh	f0f23392bc627c2043faf8cf8b9233c0b05b372cd473ef27fe8fe9074eb60daa	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 22:56:23.132	2026-07-11 23:06:23.115	2026-07-11 22:56:23.135
cmrgz4du9003mt6g45qqefsu9	72314590d51044121181c7e2e7583171fbe260595539b6e9acff3542ee1751e1	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 23:06:23.115	2026-07-11 23:16:23.137	2026-07-11 23:06:23.12
cmrgzh8tp003ot6g4dkhz1jxf	fc36befcf9c4bdde76456fb10e1cf2a7a321b63b38e3a6cdfe1c7ec6295e0fa8	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 23:16:23.138	2026-07-11 23:26:23.148	2026-07-11 23:16:23.147
cmrgzu3sk003qt6g42wt57kxe	887b205803b6cd4ae990b4a01ad9768f0b31681feab15270fb516a6752aed218	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 23:26:23.148	2026-07-11 23:36:23.113	2026-07-11 23:26:23.155
cmrh06yq8003st6g4nci4z7ck	8be0a152454bc6dc3e1af67bd97e96f00da712abf9d792d718474cbb0b58af30	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 23:36:23.113	2026-07-11 23:46:23.139	2026-07-11 23:36:23.119
cmrh0jtpk003vt6g4kpc31iea	e115976f8d0344dd2eed63f066b268ac1cd2a3259c119d5a7696b84c0b4ace0e	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 23:46:23.139	2026-07-11 23:56:23.131	2026-07-11 23:46:23.143
cmrh0woo0003xt6g4yr0md8ki	b8aaa5a18bde659bab9177e47b261e616d0fb85f5bf42fd52231cdc3e5aef862	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-10 23:56:23.131	2026-07-12 00:06:23.127	2026-07-11 23:56:23.135
cmrh19jmt003zt6g4gfvfjxmz	d2700554dc0717aa09f43794b95bab646ff0dfdbedfc06de471171eae3bbeeb8	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 00:06:23.127	2026-07-12 01:07:53.694	2026-07-12 00:06:23.14
cmrh3gnc40041t6g4kwkjk05q	a6f7d6716431735d946a4651c1e10a3bf99b1cecd177ba304bc13ba9f7539ed9	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 01:07:53.694	2026-07-12 10:58:42.722	2026-07-12 01:07:53.761
cmrhokg3u0043t6g4tey3c9y8	4a4f007c0d44f37e4b94fb8ab97c18fb9e3f83ce9c5fe92d36a66893d8656771	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 10:58:42.848	2026-07-12 11:06:20.675	2026-07-12 10:58:42.901
cmrhou9aj0045t6g4rl3nm6ul	b3c1b5d98466b39ba892e4b438d26f528a528433e1bbdbe24850f7ab79d2dd0f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 11:06:20.675	2026-07-12 11:16:20.797	2026-07-12 11:06:20.681
cmrhp74cs0047t6g4btvm2okr	6c7e2c05c174aa53bc3aee1cb2a9576b39c160c6af68633be1e00d4cdc1f40ca	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 11:16:20.797	2026-07-12 11:26:20.696	2026-07-12 11:16:20.81
cmrhpjz8n0049t6g4ykab5quv	1485cd27c7d765df52e06cfde3fa32928f8750b6176102e8fc1260d36f234c9d	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 11:26:20.696	2026-07-12 11:36:20.716	2026-07-12 11:26:20.704
cmrhpwu7o004ht6g4pic9elnd	1702eed96c264cc006f5240688115603194fdc718b0a5c80397bb5e76f0bb1b4	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 11:36:20.717	2026-07-12 11:46:20.663	2026-07-12 11:36:20.723
cmrhq9p4s004jt6g4k361tm4h	bf93f9ba744c0f1fa77d728ee20509946e61ecd149fc1165c35924c78560bd99	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 11:46:20.663	2026-07-12 11:56:20.635	2026-07-12 11:46:20.667
cmrhqmk2s004nt6g4hlnc5v24	d72586d17fe2a3a82b2852e5a0bef4adbe4d0e2d72fb61e2a0fa313b24afff35	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 11:56:20.635	2026-07-12 12:06:21.917	2026-07-12 11:56:20.643
cmrhqzg0z004vt6g4lf4smhei	87e8eb1c7939eb1be6891f2a47e265e97f9c360cab646962c2668b87bd476334	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 12:06:21.917	2026-07-12 12:16:20.702	2026-07-12 12:06:21.921
cmrhrca1u004zt6g4rn6ovq7c	eba82a1511799d70905a135ce3a2eede9abca34f2e4ca961f9b11d252b2b546d	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 12:16:20.702	2026-07-12 12:26:20.68	2026-07-12 12:16:20.705
cmrhrp4zz0051t6g4r6a9zhhc	eb1bf197a7f7dc780ade4f8d0eaf41b2e6d2f389c81392abf353c46962016211	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 12:26:20.68	2026-07-12 12:36:20.635	2026-07-12 12:26:20.687
cmrhs1zxf0053t6g4zrwqp596	8596c972689c2dfe477ecb549c4713e975e5960e9dcde75d83bb41bdaff36c13	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 12:36:20.636	2026-07-12 12:46:20.714	2026-07-12 12:36:20.642
cmrhseuy70055t6g44pegmm69	b07096bc869185140b830d26638b765a53e2ff3e2f4f6e47a57aa8a28db5963f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 12:46:20.714	2026-07-12 12:56:22.736	2026-07-12 12:46:20.718
cmrhsrrh50057t6g4a51q8nxn	0ea6c21e75b378de4ac48598be7032e6d2ef7aa0758aad782840734e4294d237	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 12:56:22.736	2026-07-12 13:06:20.622	2026-07-12 12:56:22.745
cmrht4kt2005at6g4m93raihy	cd86176665ca6ee7a40d4a6ee6e4c24191161c31106d51734c66f5cabcd4a2a1	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 13:06:20.623	2026-07-12 13:15:39.024	2026-07-12 13:06:20.629
cmrhtgjoc005gt6g4u7hknvmd	84ef7ae6863975f1e7e7fc638ac0ecd2495bf84cbbd39751484a05a72b0c896f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 13:15:39.025	2026-07-12 13:25:55.727	2026-07-12 13:15:39.036
cmrhttrkt005jt6g4rs8r0fw1	5980d1f716c822c72ba26ff8c69c511d62526c61fa42fea23ef5d3c5e8036c25	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 13:25:55.727	2026-07-12 13:35:55.62	2026-07-12 13:25:55.744
cmrhu6mel005mt6g4hz715uqr	36a6d7c9e2df26e5d0a9c1472393a9d1af12d5d604b602c8c44287fb6fb1016e	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 13:35:55.621	2026-07-12 13:45:55.744	2026-07-12 13:35:55.629
cmrhujhgt005qt6g45vukif3t	2fb33fe4a7ad6a9301dde3805caa10939d9e82b96f9625bf24c4c0cd83860f57	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 13:45:55.745	2026-07-12 13:55:55.674	2026-07-12 13:45:55.755
cmrhuwcdh005xt6g4psqnuqoh	db95a3e99fc169cd3062ca93674bb48ea074b536c1957fa3e651c6f8c240f997	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 13:55:55.674	2026-07-12 14:05:55.654	2026-07-12 13:55:55.679
cmrhv97bf0067t6g47fc9j1a1	ae47f60ce73767a1554eedba603dfafcddb8daf99c62e10c9fe9b0b7c69fb4cd	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 14:05:55.655	2026-07-12 14:15:56.029	2026-07-12 14:05:55.658
cmrhvm2kh0069t6g4cfc85dl2	44f5015995ba8e334ff32c81c7d685694b2da5b4ca4f8d763e7b341946cc3efa	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 14:15:56.029	2026-07-12 14:26:20.626	2026-07-12 14:15:56.032
cmrhvzgie006bt6g4rp612adu	cb37ec3eea701b010bba6e37697fb800e63735f3414b232545260180d24324cd	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 14:26:20.626	2026-07-12 14:36:20.657	2026-07-12 14:26:20.629
cmrhwcbi1006dt6g41vwrvto5	19a0ebc01391b8b3dcf4e08ca18af2ec6c2de362057d9e862f1e46b619c21d58	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 14:36:20.657	2026-07-12 14:46:20.645	2026-07-12 14:36:20.664
cmrhwp6g9006ft6g4jecu0kii	d72a766d23f15605b1db80df3f04aa81e520c8fba6d3603eb0de1168044ed402	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 14:46:20.645	2026-07-12 14:56:20.721	2026-07-12 14:46:20.649
cmrhx21h7006ht6g4rbkktvjg	e5fb2c4844874569b3b7f0bfe7363cf058b7d3687e509dfc7f9b48607378c503	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 14:56:20.721	2026-07-12 15:06:20.774	2026-07-12 14:56:20.731
cmrhxewhc006jt6g4w615sdwb	16210f40fc2e137fc413d80feb08c819c24521d22a748d598f76d1fca44adf5b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 15:06:20.774	2026-07-12 15:16:20.67	2026-07-12 15:06:20.781
cmrhxrrd2006lt6g4vyi9m043	5050d45df505fc93839c0d372f1d15b83e46402ce721f80550a7e69f4ef6e1eb	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 15:16:20.671	2026-07-12 15:26:20.669	2026-07-12 15:16:20.677
cmrhy4mbt006nt6g4m3muq7zz	cab96f543253f7a790a3ac9bbfba80f79911274a094de86e58f18a2ebaff9af2	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 15:26:20.669	2026-07-12 15:36:20.739	2026-07-12 15:26:20.68
cmrhyhhc7006pt6g4x3iub7e7	b8eeadf175e9bfc0b2ef52d67c1f116134b4473e5660c6f79078ddccd802966b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-11 15:36:20.739	2026-07-14 13:38:34.433	2026-07-12 15:36:20.743
cmrkp5qbf006rt6g4jmolkfin	b773f8683ea1210a19f60dc07c2adfdb5c7fe74fa68f48ccf5eaeff80ff5e391	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 13:38:34.434	2026-07-14 13:46:22.374	2026-07-14 13:38:34.477
cmrkpfrcy006tt6g452ju0g7u	ab3dec02f17f9539ad7b056fb0d4e64d11726d826fbfb42089b1a7920b7d8825	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 13:46:22.375	2026-07-14 13:56:22.28	2026-07-14 13:46:22.394
cmrkpsm8l006vt6g412yeq93z	f992c0824de1c1fb9a73f0c4f2dfaea3e740c9c953cd94adfb4d81c8a81a24ff	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 13:56:22.28	2026-07-14 14:06:22.295	2026-07-14 13:56:22.292
cmrkq5h7o006xt6g4vmrtr8et	d06c450bb2738ecfbeeb1fb52532d45fe870e74a0c61cdddf4993e3852ec249c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 14:06:22.296	2026-07-14 14:16:22.27	2026-07-14 14:06:22.304
cmrkqic68006zt6g4084jzj4t	6b88e49696a02a6da0fac8efc476906d1b6150cc3dbb319d99c54902d0f4d447	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 14:16:22.27	2026-07-14 14:26:22.473	2026-07-14 14:16:22.283
cmrkqv79q0071t6g43lmfp7pq	aa9472d43329750adb3910133faf95fdeace82b921e7eb80bb843dfce68b91d6	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 14:26:22.473	2026-07-14 14:36:22.364	2026-07-14 14:26:22.477
cmrkr825c0073t6g43bo2xzf1	ce51a20c3fb13dc0ccc87bfba6729cca80e6392a00a2a2e292cf81e9577b3031	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 14:36:22.365	2026-07-14 14:46:22.278	2026-07-14 14:36:22.368
cmrkrkx1n0075t6g4oujso5nq	0b2436635514a470640b37d36409324a454552b981450bf29db76ff8cd2a0fac	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 14:46:22.278	2026-07-14 15:22:04.769	2026-07-14 14:46:22.283
cmrksuu7a0077t6g41xr8m61o	b996bed33dd2c9247dca31092274575572e67033a1b14d4e79c82a836a88dee4	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 15:22:04.77	2026-07-14 15:26:22.23	2026-07-14 15:22:04.774
cmrkt0cv20079t6g41csmgsik	0e686173293aaf16221d6cffef06bd0ef8eac911e55ee594fc508b0cdd4d413f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 15:26:22.231	2026-07-14 15:36:22.332	2026-07-14 15:26:22.237
cmrktd7x2007bt6g4ot4r9rr9	0faa8e7f9059abec5edae3be7e54d58f3ffa7a423542f2f4af7dec5d5ffb4e4b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 15:36:22.332	2026-07-14 15:46:22.412	2026-07-14 15:36:22.356
cmrktq2xd007dt6g4klhls1bh	469a3680a696a5490dba9cadfac7b8855c1593af76c05a8f95aaca22e8a4ce02	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 15:46:22.412	2026-07-14 15:56:22.27	2026-07-14 15:46:22.416
cmrku2xs6007ft6g4xay8jd0y	7ef99278ff38a259ef3e690cfb1d2b3ef284dd717dd02cb78ba317fa7c240134	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 15:56:22.27	2026-07-14 16:06:22.292	2026-07-14 15:56:22.276
cmrkufsri007ht6g4n5er4mlx	1cfbcf94e1c837b9ffc66d25ef79aa04042e413316bb9b916f0999003d71f90a	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 16:06:22.292	2026-07-14 16:16:22.499	2026-07-14 16:06:22.301
cmrkusnvu007jt6g4s80lybcb	b699eed2cf4af4850f971fc138e1336379b6b2b28601368f0b1c34727686be9e	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 16:16:22.499	2026-07-14 16:26:22.368	2026-07-14 16:16:22.505
cmrkv5iqy007lt6g4mvy3j5e8	14049cd933d08eeb07351fea2bbafa0868018b00041161064e4f36e810ae1f9c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 16:26:22.368	2026-07-14 16:36:22.336	2026-07-14 16:26:22.377
cmrkvidot007nt6g4clhg1pde	ffac80de3252cb50416063ef3e524ee8a53f44b505e4ef4f64c6b00f4ddb62ea	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 16:36:22.336	2026-07-14 16:46:22.509	2026-07-14 16:36:22.348
cmrkvv8s7007pt6g4aueiaeo4	0c378816c8a1661076609ad8d45d7c12cf011f226a48d1e4d6a2681c65a894e0	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 16:46:22.51	2026-07-14 16:56:22.36	2026-07-14 16:46:22.518
cmrkw83mr007rt6g41zye0679	bddc2b2260f076767786ff58d81bced643baf801a4d0b79515e51ce924a87478	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 16:56:22.36	2026-07-14 17:06:22.296	2026-07-14 16:56:22.37
cmrkwkyju007tt6g4bmwe2fj2	7d4b7f99312e72dbb1ccd848914380887ea43fed162a58d85b73d849b73bfb07	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 17:06:22.297	2026-07-14 17:16:22.471	2026-07-14 17:06:22.313
cmrkwxtnf007vt6g49tlw7kxa	597321e40c3813d7090e2a417bbef97d25a1565a64e9b23c2b8a1d35d57c94dd	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 17:16:22.471	2026-07-14 17:26:22.401	2026-07-14 17:16:22.484
cmrkxaojv007xt6g4sl6sva4i	98a3e67183c1ccf6ec4a36c6e5f804d0e3c7b34616e6b6c265bc1b5656db7355	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 17:26:22.401	2026-07-14 17:36:22.318	2026-07-14 17:26:22.41
cmrkxnjgd007zt6g4fn0enmui	fb7ed72cbad2d415733b1940dd1f777bf087288f0611ccba00ebd1f8dea28dbd	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 17:36:22.318	2026-07-14 17:46:22.387	2026-07-14 17:36:22.329
cmrky0egs0081t6g4sajfxe1m	85eab221a1c696d74975a1239f547a83193594cf90ed09d782573405e783913b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 17:46:22.387	2026-07-14 17:56:22.304	2026-07-14 17:46:22.393
cmrkyd9d30083t6g412xaz7ka	8ffcc142517a1153ff860d72567986cb944b9016a975f3c108fe1183dc00989a	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 17:56:22.304	2026-07-14 18:06:22.304	2026-07-14 17:56:22.311
cmrkyq4br0085t6g4e0uif0qa	11f9a8a43bb0998cad427f24ec1f52b49899ceadfa7466fbc88deda7f47e6f86	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 18:06:22.305	2026-07-14 18:16:22.343	2026-07-14 18:06:22.31
cmrkz2zbn0087t6g44gbh9aqr	4e9794f33dc4933ca83e7005e54ed6675449e5ae8db0adb6160036d466a403d3	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 18:16:22.343	2026-07-14 18:26:22.453	2026-07-14 18:16:22.353
cmrkzfudg0089t6g4pmsofx8x	6d4828c131781c0ea385b56747b1eedfa31ab8f3624e96014e1fdb458fa159ed	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 18:26:22.453	2026-07-14 18:36:22.32	2026-07-14 18:26:22.467
cmrkzsp8b008bt6g4xn4410kn	15fc36af443ff412ef8f2f531a8877c0f3ad634ca406f227c2b99c978d2d2d7b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 18:36:22.32	2026-07-14 18:46:22.388	2026-07-14 18:36:22.33
cmrl05k8z008dt6g4mrgx995y	a3c690c4f701e41ae37b040ff4f4466df94ba8eb3218afeaab68ff04c8666fcf	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 18:46:22.389	2026-07-14 18:56:22.244	2026-07-14 18:46:22.402
cmrl0if3h008ft6g4bx6wta4q	852e594b69b7342c974d8b041735c22373fb9d14175b4edf77e39c61cbc7e4a8	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 18:56:22.244	2026-07-14 19:06:22.317	2026-07-14 18:56:22.252
cmrl0va4b008ht6g4edg9nlyd	f220920b63f6aa14b69a70dea2ba2b2bec670b65bce6bae8e3da1a0aa7186def	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 19:06:22.317	2026-07-14 19:16:22.345	2026-07-14 19:06:22.328
cmrl18544008mt6g4zye6i4ni	340bcdfb669c69dcd0bce329461bd209eee55147e79f3f02c922fd5e81375d7b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 19:16:22.346	2026-07-14 19:26:22.333	2026-07-14 19:16:22.362
cmrl1l01z008ot6g4cujnc3k2	88be09f05a71772a45eedfab31d886b8e773ec8c7d81430fe1fd46ac9fd373d4	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 19:26:22.334	2026-07-14 19:36:22.324	2026-07-14 19:26:22.341
cmrl1xv0b008qt6g4tp6pmtuz	b8d49a5aaf5ee3fe143c63f470bd04f61e489ea89368644ddbbb663b7216eee4	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 19:36:22.324	2026-07-14 19:46:22.393	2026-07-14 19:36:22.33
cmrl2aq0y008st6g48rr45dso	7a6de0cabc5aff4d70d2165523e35d5b56764748620541f76491c139b5250519	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 19:46:22.393	2026-07-14 19:56:22.418	2026-07-14 19:46:22.4
cmrl2nl0b008ut6g4ql90gyvi	a5dd1f91a94663f88d9325f4cebd1b6648f59dd811993e35e329c980a99aa9c7	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 19:56:22.418	2026-07-14 20:06:22.257	2026-07-14 19:56:22.426
cmrl30fuj008wt6g4kw1ccrx5	c3983c19b470548038a67df9bf055e91150d303b81e1e88716a495842909f093	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 20:06:22.257	2026-07-14 20:16:22.345	2026-07-14 20:06:22.266
cmrl3davi008yt6g4s4ep03y8	97447bbcec8c9a8a93bb5dbe0e8144f0ebece710cbbbd0f84a6a1365f44da2a2	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 20:16:22.345	2026-07-14 20:26:22.271	2026-07-14 20:16:22.35
cmrl3q5s70090t6g40471x88g	1e6bcf949032f6854757869118a471c2fe84e031c61dfd76b8dee9ae5cdf3484	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 20:26:22.271	2026-07-14 20:36:22.318	2026-07-14 20:26:22.279
cmrl430tp0092t6g4tgnw0t5y	72441fc40f6d59a49ec3eefc0bd66a9268ab6940642710251b2481fbf0395515	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 20:36:22.318	2026-07-14 20:46:22.697	2026-07-14 20:36:22.323
cmrl4fw1f0094t6g4eyae998o	4bf6424b51efb0bb0c1af3280da0e0e77ced708081fc5ba33226c8bb6774b19e	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 20:46:22.698	2026-07-14 21:41:19.703	2026-07-14 20:46:22.707
cmrl6mw1g000ft6ss6sz571ul	9d285d7754b78c37ae0ca0c0849bc00394c8d89bb44c004e9a91e202e79ce389	cmr92chs50000t6cklv6m3y9t	node	::1	2026-08-13 21:47:48.531	\N	2026-07-14 21:47:48.532
cmrl6ek0v0005t6sss9juuexn	80b02252a6a07b4bbe4b59d87d676456ff371d6eac005e71396d0b495cb7dcb7	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 21:41:19.703	2026-07-14 21:51:21.216	2026-07-14 21:41:19.708
cmrl6rg5e000nt6ssh83vhpd1	1e5a24ac199a217399a2ee9d5b4b93949103ae01ef754cc06bca84ac1a346a62	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 21:51:21.216	2026-07-14 22:01:21.192	2026-07-14 21:51:21.218
cmrl74b3d000pt6ssrz6u5kl4	19dde59a154c66ca83dcc12074eec94df0041f2ee4b59e92f779128033fea96c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 22:01:21.192	2026-07-14 22:11:21.263	2026-07-14 22:01:21.193
cmrl7h642000rt6sswa1hsg9e	d8987f0eb3d812c08b0556a0ebf352b61dc4ea891631cace6aa43217b8e9d330	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 22:11:21.263	2026-07-14 22:21:21.242	2026-07-14 22:11:21.266
cmrl7u12g000zt6ssqcix2j7b	1a4bffd6a6be8acfc2140182054dd824c342550a2fa0f2530a30f861c501f3f1	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 22:21:21.243	2026-07-14 22:31:21.271	2026-07-14 22:21:21.253
cmrl86w1m0011t6sserylk791	525ae164a72d69b54346fd3932488639d07b41b7409fae9c585bbb92b8a6ce28	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 22:31:21.271	2026-07-14 22:41:21.226	2026-07-14 22:31:21.274
cmrl8jqz20013t6ssrggt2fdq	e8d7f3e5abcb807950f7abf33e75281ae8ff28f2dc14b468cacca0c2cab0154f	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 22:41:21.226	2026-07-14 22:51:22.277	2026-07-14 22:41:21.229
cmrl8wmr90015t6ss8yp6zepo	30c40b2ea65eaf690ee5c03797ed2840727ac97e5a802417fd76eca6b5776545	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 22:51:22.277	2026-07-14 23:01:22.269	2026-07-14 22:51:22.292
cmrl99hpg0017t6sskm10n5cs	b79fb1953532efa9d70d92f3ee78066ce775d8cc24cced4905f34767a6329219	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 23:01:22.269	2026-07-14 23:11:22.301	2026-07-14 23:01:22.275
cmrl9mcp70019t6ssfez0oogh	64d99879c62574df7c6f051d2093320fb381686760e007ca3c22c2a05c18abdb	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 23:11:22.302	2026-07-14 23:21:22.224	2026-07-14 23:11:22.314
cmrl9z7lk001bt6ss02jvb81u	93b18bb6daf186791545733b820cefb3dcad98236ebc383c4509be5b0db0198b	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 23:21:22.224	2026-07-14 23:31:22.303	2026-07-14 23:21:22.231
cmrlac2mc001dt6ssul3avcjy	9c482524f2addcb3bddd38b9357105fb3685c8d9062f754623ae04c62fcb2286	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 23:31:22.303	2026-07-14 23:41:22.217	2026-07-14 23:31:22.308
cmrlaoxim001ft6sssgwgmzlb	581584c8f9ea3f0fadaf2445deeb0751b3c56ce4ede5b3d9dd70313d4fe7d744	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 23:41:22.219	2026-07-14 23:51:22.263	2026-07-14 23:41:22.221
cmrlb1sir001ht6ssoxdo65vb	0712f270a557dc8dbf6e56464b0fd805de56272bfaf2cc9b1c96ac077a05418c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-13 23:51:22.263	2026-07-15 00:01:22.228	2026-07-14 23:51:22.274
cmrlbeng8001jt6ss8i5caqpb	c481d1f4b28cb5771c3004326abda9523bd9d6596a866133a8ce90a9579cf75c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-14 00:01:22.228	2026-07-15 00:11:22.201	2026-07-15 00:01:22.232
cmrlbrie3001lt6ssdvdnvwt4	cb9a8ee64fb5c3e961aa584643f833cf5b9d67347e802cf6fa7e279213d745e0	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-14 00:11:22.201	2026-07-15 00:21:22.205	2026-07-15 00:11:22.203
cmrlc4dcx001nt6ssm1bhmfhp	8e6dfac477c728da500abdf432eb68c99e57e6f75d0efd1a196778b58df3e3a9	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-14 00:21:22.205	2026-07-15 00:31:22.288	2026-07-15 00:21:22.208
cmrlch8dy001pt6ssnthx7zkg	9120809ef9ea06ea9ce59d462f137808f28c375c7e97d583f13f3ac4555c9be2	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-14 00:31:22.288	2026-07-15 00:41:22.22	2026-07-15 00:31:22.293
cmrlcu3am001rt6ss9heheayo	db9c1599b6012b8d3b6bb3a6b189d70ccf4e093a47eaecbf621c7ee854a70542	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-14 00:41:22.22	2026-07-15 00:51:22.311	2026-07-15 00:41:22.222
cmrld6ybt001tt6sso1l0n2qe	f1eb5c8cc70dd8312638fb9833711aabe722f0f245c8d736b9582063b44acbfe	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-14 00:51:22.311	2026-07-15 01:01:22.222	2026-07-15 00:51:22.313
cmrldjt81001vt6ss0m0ohz22	69e680c22241bafe755d5949320e1a27ad65c88a1e2da2f961326689567f23cd	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-14 01:01:22.222	2026-07-15 01:11:22.231	2026-07-15 01:01:22.225
cmrldwo6y001xt6ssymax2akv	2a0fa71d9dc53295942a7412c57e314ecd4325997b771c557935aca60e76f16c	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-14 01:11:22.232	2026-07-15 01:21:22.272	2026-07-15 01:11:22.234
cmrle9j6r001zt6ssv3khxnos	8969996c285103e2573410f040340d23a264b5bc46334a96fa1666d381a8690a	cmr92chs50000t6cklv6m3y9t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	::1	2026-08-14 01:21:22.272	\N	2026-07-15 01:21:22.275
\.


--
-- Data for Name: SiteSetting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SiteSetting" (key, value, "updatedAt") FROM stdin;
socialLinks	[{"key": "whatsapp", "url": "https://wa.me/919953900123", "label": "WhatsApp us"}, {"key": "linkedin", "url": "https://www.linkedin.com/company/digisutrasolutionsofficial/", "label": "LinkedIn"}, {"key": "instagram", "url": "https://www.instagram.com/digisutrasolutions", "label": "Instagram"}, {"key": "youtube", "url": "https://www.youtube.com/@DigiSutraSolutions", "label": "YouTube"}]	2026-07-14 21:33:31.481
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, "passwordHash", role, "isActive", "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
cmr92ci1j0001t6ck3cn60p6l	Dev One	developer@digisutra.com	$2b$12$YqgNMVJq.ETasEai7Z/CbuVbIUfmODXEwawbJ83xOml0KQ.IXAKxG	DEVELOPER	t	2026-07-06 17:18:42.27	2026-07-06 10:14:31.256	2026-07-06 17:18:42.271
cmr92cikh0003t6cky1knny6c	SEO One	seo@digisutra.com	$2b$12$HAYI5QPZi9MT7wEUz1L8qejYvQpFF7Vi6bFmDxoLz2jtJVUMI3qde	SEO_MANAGER	t	2026-07-06 17:18:43.763	2026-07-06 10:14:31.937	2026-07-06 17:18:43.765
cmr92ciav0002t6ckbbqnn7w4	QA One	tester@digisutra.com	$2b$12$t1s6TYywDVdd3ayvAGnjIO.kprolU3M9aU1ZnyAUv20ysHyoD29/.	TESTER	t	2026-07-06 20:13:20.788	2026-07-06 10:14:31.591	2026-07-06 20:13:20.793
cmr92chs50000t6cklv6m3y9t	Super Admin	admin@digisutra.com	$2b$12$Sclr1PPtYp52LBN34k6VH.ZPlEBvwZfm6CuuIkSMU3A4sjccsLTdK	SUPER_ADMIN	t	2026-07-14 21:47:48.534	2026-07-06 10:14:30.917	2026-07-14 21:47:48.536
\.


--
-- Data for Name: Video; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Video" (id, title, slug, provider, "videoId", description, category, "thumbnailUrl", "durationSec", featured, "uploadedByName", "createdAt", "updatedAt") FROM stdin;
cmr9jhbp6000at6ecwngjd53d	Getting started with DigiSutra	getting-started-with-digisutra	YOUTUBE	M7lc1UVf-VE	A quick look at how we run marketing and engineering as one accountable team.	Showreel	https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg	\N	t	Seed	2026-07-06 18:14:09.787	2026-07-06 18:14:09.787
\.


--
-- Data for Name: WorkflowTransition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkflowTransition" (id, "pageId", "from", "to", note, "byId", "byName", "createdAt") FROM stdin;
cmr9fqusy000at68wyneom9ug	cmr9fqsrq0005t68w6s0kif3j	DRAFT	TESTING	\N	cmr92ci1j0001t6ck3cn60p6l	Dev One	2026-07-06 16:29:35.984
cmr9fqwh3000qt68w1ux73y3e	cmr9fqsrq0005t68w6s0kif3j	TESTING	DRAFT	Mobile layout broken, see bug report.	cmr92ciav0002t6ckbbqnn7w4	QA One	2026-07-06 16:29:38.15
cmr9fqz4l001at68w6ftpsas7	cmr9fqsrq0005t68w6s0kif3j	DRAFT	TESTING	\N	cmr92ci1j0001t6ck3cn60p6l	Dev One	2026-07-06 16:29:41.588
cmr9fqzol001kt68wuaw7kniv	cmr9fqsrq0005t68w6s0kif3j	TESTING	SEO_REVIEW	\N	cmr92ciav0002t6ckbbqnn7w4	QA One	2026-07-06 16:29:42.308
cmr9fr09t001ut68w8lh5jdwm	cmr9fqsrq0005t68w6s0kif3j	SEO_REVIEW	APPROVAL	\N	cmr92cikh0003t6cky1knny6c	SEO One	2026-07-06 16:29:43.072
cmr9fr0q10023t68wsgizr082	cmr9fqsrq0005t68w6s0kif3j	APPROVAL	APPROVED	\N	cmr92chs50000t6cklv6m3y9t	Super Admin	2026-07-06 16:29:43.657
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4014fb6d-1c5a-4d6e-a248-ea244ce4bb7f	896533a39a2052285d6ed878047ecdfe13a4a72076f974cf4baee4510cc224c3	2026-07-06 15:19:45.255263+05:30	20260706094945_init_users_auth_audit	\N	\N	2026-07-06 15:19:45.227517+05:30	1
c3077f30-32e7-4c94-a6c9-4eccb1785fd2	3880edfc8ebd6067a432eb659c1a4c934eecf0ceacd8cc1e5bbec20dece37b6f	2026-07-06 20:54:32.899216+05:30	20260706152432_phase2_pages_cms	\N	\N	2026-07-06 20:54:32.88372+05:30	1
bd53bafe-5b34-47fa-8654-72cdc075de01	bf21c53f2e065f712aac096505b0ac066e0d015bb33fcc7d912228db1ac83449	2026-07-06 21:35:26.106573+05:30	20260706160526_phase3_workflow_notifications	\N	\N	2026-07-06 21:35:26.084154+05:30	1
d1397c7d-ce4f-43ed-bdf9-871b14e544c7	e19580a4996db890e8e3c8b7bca9a3c7bfbf210fbaaaa582310ae953d76dac18	2026-07-06 22:33:18.109898+05:30	20260706170318_phase4_media_blog_forms	\N	\N	2026-07-06 22:33:18.093009+05:30	1
7287727c-d322-49f9-878e-3aab2c5a30d3	c0a6ae3ea268707b1b62fe176b095581ccbf3b98489bc6aa0b1d0b1c2136d6cf	2026-07-06 23:22:22.896806+05:30	20260706175222_phase5_ai_video_analytics_redirects	\N	\N	2026-07-06 23:22:22.880393+05:30	1
8d5d29b6-834a-4fda-bf09-ace0cb7096dc	c07aa1860049a1b6839954356726fa58f7021515a61be3723f57c4f32e6f000c	2026-07-15 01:51:46.234318+05:30	20260714202146_phase6_engagement_ads_comments	\N	\N	2026-07-15 01:51:46.214566+05:30	1
\.


--
-- Name: AdBanner AdBanner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdBanner"
    ADD CONSTRAINT "AdBanner_pkey" PRIMARY KEY (id);


--
-- Name: AiGeneration AiGeneration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiGeneration"
    ADD CONSTRAINT "AiGeneration_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: BlogComment BlogComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogComment"
    ADD CONSTRAINT "BlogComment_pkey" PRIMARY KEY (id);


--
-- Name: BlogPost BlogPost_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogPost"
    ADD CONSTRAINT "BlogPost_pkey" PRIMARY KEY (id);


--
-- Name: BugReport BugReport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BugReport"
    ADD CONSTRAINT "BugReport_pkey" PRIMARY KEY (id);


--
-- Name: FormSubmission FormSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FormSubmission"
    ADD CONSTRAINT "FormSubmission_pkey" PRIMARY KEY (id);


--
-- Name: Form Form_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Form"
    ADD CONSTRAINT "Form_pkey" PRIMARY KEY (id);


--
-- Name: MediaAsset MediaAsset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MediaAsset"
    ADD CONSTRAINT "MediaAsset_pkey" PRIMARY KEY (id);


--
-- Name: NewsletterSubscriber NewsletterSubscriber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NewsletterSubscriber"
    ADD CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PageComment PageComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageComment"
    ADD CONSTRAINT "PageComment_pkey" PRIMARY KEY (id);


--
-- Name: PageVersion PageVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageVersion"
    ADD CONSTRAINT "PageVersion_pkey" PRIMARY KEY (id);


--
-- Name: PageView PageView_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageView"
    ADD CONSTRAINT "PageView_pkey" PRIMARY KEY (id);


--
-- Name: Page Page_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_pkey" PRIMARY KEY (id);


--
-- Name: Redirect Redirect_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Redirect"
    ADD CONSTRAINT "Redirect_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: SiteSetting SiteSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SiteSetting"
    ADD CONSTRAINT "SiteSetting_pkey" PRIMARY KEY (key);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Video Video_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Video"
    ADD CONSTRAINT "Video_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowTransition WorkflowTransition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkflowTransition"
    ADD CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AdBanner_placement_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AdBanner_placement_active_idx" ON public."AdBanner" USING btree (placement, active);


--
-- Name: AiGeneration_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AiGeneration_createdAt_idx" ON public."AiGeneration" USING btree ("createdAt");


--
-- Name: AuditLog_entity_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entity_createdAt_idx" ON public."AuditLog" USING btree (entity, "createdAt");


--
-- Name: AuditLog_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_userId_createdAt_idx" ON public."AuditLog" USING btree ("userId", "createdAt");


--
-- Name: BlogComment_postId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BlogComment_postId_status_idx" ON public."BlogComment" USING btree ("postId", status);


--
-- Name: BlogComment_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BlogComment_status_createdAt_idx" ON public."BlogComment" USING btree (status, "createdAt");


--
-- Name: BlogPost_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BlogPost_category_idx" ON public."BlogPost" USING btree (category);


--
-- Name: BlogPost_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BlogPost_slug_key" ON public."BlogPost" USING btree (slug);


--
-- Name: BlogPost_status_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BlogPost_status_publishedAt_idx" ON public."BlogPost" USING btree (status, "publishedAt");


--
-- Name: BugReport_pageId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BugReport_pageId_status_idx" ON public."BugReport" USING btree ("pageId", status);


--
-- Name: FormSubmission_formId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FormSubmission_formId_createdAt_idx" ON public."FormSubmission" USING btree ("formId", "createdAt");


--
-- Name: Form_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Form_slug_key" ON public."Form" USING btree (slug);


--
-- Name: MediaAsset_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MediaAsset_createdAt_idx" ON public."MediaAsset" USING btree ("createdAt");


--
-- Name: MediaAsset_filename_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MediaAsset_filename_key" ON public."MediaAsset" USING btree (filename);


--
-- Name: NewsletterSubscriber_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "NewsletterSubscriber_createdAt_idx" ON public."NewsletterSubscriber" USING btree ("createdAt");


--
-- Name: NewsletterSubscriber_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON public."NewsletterSubscriber" USING btree (email);


--
-- Name: Notification_userId_readAt_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON public."Notification" USING btree ("userId", "readAt", "createdAt");


--
-- Name: PageComment_pageId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PageComment_pageId_createdAt_idx" ON public."PageComment" USING btree ("pageId", "createdAt");


--
-- Name: PageVersion_pageId_version_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PageVersion_pageId_version_key" ON public."PageVersion" USING btree ("pageId", version);


--
-- Name: PageView_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PageView_createdAt_idx" ON public."PageView" USING btree ("createdAt");


--
-- Name: PageView_path_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PageView_path_createdAt_idx" ON public."PageView" USING btree (path, "createdAt");


--
-- Name: Page_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Page_slug_key" ON public."Page" USING btree (slug);


--
-- Name: Page_status_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Page_status_publishedAt_idx" ON public."Page" USING btree (status, "publishedAt");


--
-- Name: Page_workflowStage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Page_workflowStage_idx" ON public."Page" USING btree ("workflowStage");


--
-- Name: Redirect_fromPath_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Redirect_fromPath_key" ON public."Redirect" USING btree ("fromPath");


--
-- Name: RefreshToken_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON public."RefreshToken" USING btree ("tokenHash");


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Video_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Video_featured_idx" ON public."Video" USING btree (featured);


--
-- Name: Video_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Video_slug_key" ON public."Video" USING btree (slug);


--
-- Name: WorkflowTransition_pageId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WorkflowTransition_pageId_createdAt_idx" ON public."WorkflowTransition" USING btree ("pageId", "createdAt");


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BlogComment BlogComment_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogComment"
    ADD CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."BlogPost"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BugReport BugReport_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BugReport"
    ADD CONSTRAINT "BugReport_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public."Page"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FormSubmission FormSubmission_formId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FormSubmission"
    ADD CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES public."Form"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PageComment PageComment_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageComment"
    ADD CONSTRAINT "PageComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public."Page"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PageVersion PageVersion_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageVersion"
    ADD CONSTRAINT "PageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public."Page"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Page Page_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Page Page_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkflowTransition WorkflowTransition_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkflowTransition"
    ADD CONSTRAINT "WorkflowTransition_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public."Page"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

