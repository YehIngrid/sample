// ── School (校園攻略站) backend client — Identity & Account endpoints ──
// Mirrors the structure of ../BackendService.js: a thin axios wrapper per
// feature area, one public method per endpoint, errors normalized into
// Chinese user-facing messages while keeping the original error for callers
// that want to inspect `error.response`.
import { captureException } from '../default/sentry-init.js';

// Allowed MIME types for proof-of-identity uploads. Kept as an explicit
// allow-list (not a deny-list) so an unexpected file type is rejected by
// default rather than accidentally let through.
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, 'application/pdf'];
const MAX_PROOF_FILE_SIZE = 10 * 1024 * 1024; // 10MB, matches the UI copy shown to users

export default class SchoolBackendService {
    constructor() {
        this.baseUrl = import.meta.env.VITE_API_BASE_URL;
        // Own axios instance (same pattern as BackendService.http): explicit
        // withCredentials so the httpOnly JWT cookie is always sent, regardless
        // of whether another service on the page has already touched
        // axios.defaults — don't rely on side effects from other modules.
        this.http = axios.create({
            baseURL: this.baseUrl,
            withCredentials: true,
            timeout: 30000,
        });
    }

    // 403 from a suspended/unverified account — same convention as BackendService._forbidden
    _forbidden(error) {
        if (error?.response?.status === 403) throw new Error('存取被禁止 - 帳號已停用或電子郵件未驗證');
    }

    // Reject obviously-wrong files on the client before spending an upload.
    // This is a UX nicety, NOT a security boundary — the backend must still
    // validate type/size/content itself; a client-side check can always be
    // bypassed by calling the API directly.
    _validateProofFile(file, { allowPdf = false } = {}) {
        if (!file) throw new Error('請上傳證明文件');
        const allowed = allowPdf ? DOCUMENT_MIME_TYPES : IMAGE_MIME_TYPES;
        const isPdfByName = allowPdf && /\.pdf$/i.test(file.name || '');
        if (!allowed.includes(file.type) && !isPdfByName) {
            throw new Error(allowPdf ? '僅支援 JPG / PNG / PDF 格式' : '僅支援 JPG / PNG / WEBP 格式');
        }
        if (file.size > MAX_PROOF_FILE_SIZE) {
            throw new Error('檔案大小請勿超過 10MB');
        }
    }

    // ── Identity verification (學生證審核) ──────────────────────────

    // POST /api/account/identity-verifications — submit a student-ID verification request.
    // Only one PENDING request is allowed per account at a time (enforced server-side).
    // studentStatus/enrollYear are optional per the live spec (confirmed 2026-11-24 via
    // dev.treasurehub.tw/api/api-docs/#/School — not in the older downloaded doc).
    async submitIdentityVerification({ realName, schoolName, studentStatus, enrollYear, proof } = {}) {
        try {
            if (!realName?.trim()) throw new Error('請輸入真實姓名');
            this._validateProofFile(proof);

            const formData = new FormData();
            formData.append('realName', realName.trim());
            if (schoolName?.trim()) formData.append('schoolName', schoolName.trim());
            if (studentStatus) formData.append('studentStatus', studentStatus);
            if (enrollYear != null && enrollYear !== '') formData.append('enrollYear', String(enrollYear));
            formData.append('proof', proof);

            const response = await this.http.post('/api/account/identity-verifications', formData);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('送出學生證審核失敗：', error);
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 409) throw new Error(msg || '已有一筆審核中的申請，請等待審核完成後再重新送出');
            if (status === 400) throw new Error(msg || '資料格式錯誤，請確認欄位與檔案後再試');
            if (status) captureException(error);
            throw error instanceof Error && !status ? error : new Error(msg || '送出審核失敗，請稍後再試');
        }
    }

    // GET /api/account/identity-verifications — my own submission history
    async getMyIdentityVerifications() {
        try {
            const response = await this.http.get('/api/account/identity-verifications');
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得學生證審核紀錄失敗：', error);
            return Promise.reject(error);
        }
    }

    // ── Education records (學習經歷：轉學／轉系／雙主修／輔系／交換) ──

    // POST /api/account/education-records — submit an education-record application.
    async submitEducationRecord({ type, schoolName, department, fromSchool, startedAt, endedAt, sortOrder, proof } = {}) {
        try {
            if (!type) throw new Error('請選擇學習經歷類型');
            if (!schoolName?.trim()) throw new Error('請輸入學校名稱');
            this._validateProofFile(proof, { allowPdf: true });

            const formData = new FormData();
            formData.append('type', type);
            formData.append('schoolName', schoolName.trim());
            if (department?.trim()) formData.append('department', department.trim());
            if (fromSchool?.trim()) formData.append('fromSchool', fromSchool.trim());
            if (startedAt) formData.append('startedAt', startedAt);
            if (endedAt) formData.append('endedAt', endedAt);
            if (sortOrder != null) formData.append('sortOrder', String(sortOrder));
            formData.append('proof', proof);

            const response = await this.http.post('/api/account/education-records', formData);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('送出學習經歷申請失敗：', error);
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 400) throw new Error(msg || '資料格式錯誤，請確認欄位與檔案後再試');
            if (status) captureException(error);
            throw error instanceof Error && !status ? error : new Error(msg || '送出申請失敗，請稍後再試');
        }
    }

    // GET /api/account/education-records — my own application history
    async getMyEducationRecords() {
        try {
            const response = await this.http.get('/api/account/education-records');
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得學習經歷申請紀錄失敗：', error);
            return Promise.reject(error);
        }
    }

    // ── Achievements / titles (成就與頭銜) ──────────────────────────

    // POST /api/school/achievements — apply for an achievement/title.
    // NOTE: `categoryId` is intentionally NOT sent here even though the current
    // API spec lists it as required — there is no endpoint to fetch the list of
    // valid achievement categories, so the UI never collects one. This is a
    // confirmed decision (see memory: school_api_doc_gaps.md #1) pending the
    // backend dropping `categoryId` from the required fields.
    async submitAchievement({ name, shortName, competitionName, organizer, year, prizeAmount, proof } = {}) {
        try {
            if (!name?.trim()) throw new Error('請輸入頭銜名稱');
            if (!shortName?.trim()) throw new Error('請輸入顯示簡稱');
            this._validateProofFile(proof, { allowPdf: true });

            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('shortName', shortName.trim());
            if (competitionName?.trim()) formData.append('competitionName', competitionName.trim());
            if (organizer?.trim()) formData.append('organizer', organizer.trim());
            if (year != null && year !== '') formData.append('year', String(year));
            if (prizeAmount != null && prizeAmount !== '') formData.append('prizeAmount', String(prizeAmount));
            formData.append('proof', proof);

            const response = await this.http.post('/api/school/achievements', formData);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('送出頭銜申請失敗：', error);
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 400) throw new Error(msg || '資料格式錯誤，請確認欄位與檔案後再試');
            if (status) captureException(error);
            throw error instanceof Error && !status ? error : new Error(msg || '送出申請失敗，請稍後再試');
        }
    }

    // PATCH /api/school/achievements/{id}/enabled — show/hide an already-approved
    // achievement on the public author profile.
    async setAchievementEnabled(id, enabled) {
        if (!id) return Promise.reject(new Error('Achievement id is required'));
        try {
            const response = await this.http.patch(
                `/api/school/achievements/${encodeURIComponent(id)}/enabled`,
                { enabled: !!enabled }
            );
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('切換頭銜顯示狀態失敗：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '切換失敗，請稍後再試');
        }
    }

    // PUT /api/school/achievements/{id} — edit a PENDING/REJECTED application.
    // Treated server-side as a resubmission: goes back to PENDING and re-queues;
    // 409 if the application has already been APPROVED.
    async updateAchievement(id, { name, shortName, competitionName, organizer, year, prizeAmount, proof } = {}) {
        if (!id) return Promise.reject(new Error('Achievement id is required'));
        try {
            const formData = new FormData();
            if (name?.trim()) formData.append('name', name.trim());
            if (shortName?.trim()) formData.append('shortName', shortName.trim());
            if (competitionName?.trim()) formData.append('competitionName', competitionName.trim());
            if (organizer?.trim()) formData.append('organizer', organizer.trim());
            if (year != null && year !== '') formData.append('year', String(year));
            if (prizeAmount != null && prizeAmount !== '') formData.append('prizeAmount', String(prizeAmount));
            if (proof) {
                this._validateProofFile(proof, { allowPdf: true });
                formData.append('proof', proof);
            }
            const response = await this.http.put(`/api/school/achievements/${encodeURIComponent(id)}`, formData);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('修改頭銜申請失敗：', error);
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 409) throw new Error(msg || '此申請已核准，無法再修改');
            if (status) captureException(error);
            throw new Error(msg || '修改失敗，請稍後再試');
        }
    }

    // ── Articles (校園攻略站文章：列表/詳情/草稿/互動) ──────────────
    // `/api/school/articles/{id}/*` 互動類端點（reviews/bookmark/like）共用一組
    // 403：讀者讀不到全文時（例如他校讀者看同校限定文章）不能操作，一律回傳
    // 同一句中文訊息，不特別分流。

    _forbiddenArticleAction(error) {
        if (error?.response?.status === 403) {
            throw new Error(error?.response?.data?.message || '目前沒有權限操作這篇文章');
        }
    }

    // GET /api/school/categories — 文章分類（含每類三道題）
    async getCategories() {
        try {
            const response = await this.http.get('/api/school/categories');
            return response.data;
        } catch (error) {
            console.error('取得文章分類失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/school/tags — hashtag 搜尋/熱門
    async getTags({ q, limit = 20 } = {}) {
        try {
            const params = { limit };
            if (q) params.q = q;
            const response = await this.http.get('/api/school/tags', { params });
            return response.data;
        } catch (error) {
            console.error('取得 hashtag 失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/school/stats — 文章總數、已認證作者數、本月閱讀數
    async getSchoolStats() {
        try {
            const response = await this.http.get('/api/school/stats');
            return response.data;
        } catch (error) {
            console.error('取得校園攻略站統計失敗：', error);
            return Promise.reject(error);
        }
    }

    // POST /api/school/articles — 建立文章（DRAFT），需 writable；目前只開放
    // type=FREE，送 PAID 回 422（見 school_api_doc_gaps.md）。
    async createArticle(payload = {}) {
        try {
            const response = await this.http.post('/api/school/articles', payload);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('建立文章失敗：', error);
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 403) throw new Error(msg || '尚未通過就學證明實名認證，無法發佈文章');
            if (status === 422) throw new Error(msg || '目前僅開放免費文章');
            if (status) captureException(error);
            throw new Error(msg || '建立文章失敗，請稍後再試');
        }
    }

    // GET /api/school/articles/{id} — 單篇 metadata（不含正文）
    async getArticle(id) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.get(`/api/school/articles/${encodeURIComponent(id)}`);
            return response.data;
        } catch (error) {
            console.error('取得文章詳情失敗：', error);
            return Promise.reject(error);
        }
    }

    // PUT /api/school/articles/{id} — 編輯（已發佈的文章編輯後維持 PUBLISHED，不送審）
    async updateArticle(id, payload = {}) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.put(`/api/school/articles/${encodeURIComponent(id)}`, payload);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('更新文章失敗：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '更新文章失敗，請稍後再試');
        }
    }

    // DELETE /api/school/articles/{id} — 軟刪除（ARCHIVED）
    async deleteArticle(id) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.delete(`/api/school/articles/${encodeURIComponent(id)}`);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('刪除文章失敗：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '刪除文章失敗，請稍後再試');
        }
    }

    // GET /api/school/articles/{id}/content — 內文。登入且已解鎖回全文，否則回
    // 純文字預覽；付費文章僅作者可讀，同校限定文章需讀者已認證學校與文章相同。
    async getArticleContent(id) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.get(`/api/school/articles/${encodeURIComponent(id)}/content`);
            return response.data;
        } catch (error) {
            this._forbiddenArticleAction(error);
            console.error('取得文章內文失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/school/articles/{id}/recommended — 同作者或同分類推薦
    async getRecommendedArticles(id) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.get(`/api/school/articles/${encodeURIComponent(id)}/recommended`);
            return response.data;
        } catch (error) {
            console.error('取得推薦文章失敗：', error);
            return Promise.reject(error);
        }
    }

    // POST /api/school/articles/{id}/submit — 發佈（一律直接 PUBLISHED，不經審核；
    // 分類有設題則 answers 必填，須先透過 updateArticle/createArticle 送入）
    async submitArticle(id) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.post(`/api/school/articles/${encodeURIComponent(id)}/submit`);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('發佈文章失敗：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '發佈失敗，請稍後再試');
        }
    }

    // GET /api/school/articles/{id}/reviews — 留言/評分/回覆（平鋪，以 parentId
    // 組樹；匿名留言 author 為 null）
    async getArticleReviews(id, { page = 1, limit = 20 } = {}) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.get(`/api/school/articles/${encodeURIComponent(id)}/reviews`, { params: { page, limit } });
            return response.data;
        } catch (error) {
            console.error('取得文章留言失敗：', error);
            return Promise.reject(error);
        }
    }

    // POST /api/school/articles/{id}/reviews — 留言/評分（頂層可帶 rating 1-5，
    // 回覆用 parentId 不可帶 rating；一人一篇一則頂層）
    async createArticleReview(id, { body, rating, parentId, displayMode } = {}) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            if (!body?.trim()) throw new Error('請輸入留言內容');
            const payload = { body: body.trim() };
            if (rating != null && !parentId) payload.rating = rating;
            if (parentId) payload.parentId = parentId;
            if (displayMode) payload.displayMode = displayMode;
            const response = await this.http.post(`/api/school/articles/${encodeURIComponent(id)}/reviews`, payload);
            return response.data;
        } catch (error) {
            this._forbiddenArticleAction(error);
            console.error('送出留言失敗：', error);
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 409) throw new Error(msg || '每篇文章只能留一則頂層評論');
            throw error instanceof Error && !status ? error : new Error(msg || '送出留言失敗，請稍後再試');
        }
    }

    // DELETE /api/school/reviews/{id} — 軟刪除留言（本人或後台；頂層留言連同回覆）
    async deleteReview(id) {
        if (!id) return Promise.reject(new Error('Review id is required'));
        try {
            const response = await this.http.delete(`/api/school/reviews/${encodeURIComponent(id)}`);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('刪除留言失敗：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '刪除留言失敗，請稍後再試');
        }
    }

    // POST /api/school/reviews/{id}/like — 留言按讚（冪等）
    async likeReview(id) {
        if (!id) return Promise.reject(new Error('Review id is required'));
        try {
            const response = await this.http.post(`/api/school/reviews/${encodeURIComponent(id)}/like`);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('留言按讚失敗：', error);
            return Promise.reject(error);
        }
    }

    // POST /api/school/articles/{id}/bookmark — 收藏（冪等）
    async bookmarkArticle(id) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.post(`/api/school/articles/${encodeURIComponent(id)}/bookmark`);
            return response.data;
        } catch (error) {
            this._forbiddenArticleAction(error);
            console.error('收藏文章失敗：', error);
            return Promise.reject(error);
        }
    }

    // DELETE /api/school/articles/{id}/bookmark — 取消收藏（冪等）
    async unbookmarkArticle(id) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.delete(`/api/school/articles/${encodeURIComponent(id)}/bookmark`);
            return response.data;
        } catch (error) {
            console.error('取消收藏失敗：', error);
            return Promise.reject(error);
        }
    }

    // POST /api/school/articles/{id}/like — 喜歡（冪等）
    async likeArticle(id) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.post(`/api/school/articles/${encodeURIComponent(id)}/like`);
            return response.data;
        } catch (error) {
            this._forbiddenArticleAction(error);
            console.error('喜歡文章失敗：', error);
            return Promise.reject(error);
        }
    }

    // DELETE /api/school/articles/{id}/like — 取消喜歡（冪等）
    async unlikeArticle(id) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const response = await this.http.delete(`/api/school/articles/${encodeURIComponent(id)}/like`);
            return response.data;
        } catch (error) {
            console.error('取消喜歡失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/school/drafts/{id} — 取草稿（本人的 DRAFT/REJECTED 文章）
    async getDraft(id) {
        if (!id) return Promise.reject(new Error('Draft id is required'));
        try {
            const response = await this.http.get(`/api/school/drafts/${encodeURIComponent(id)}`);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得草稿失敗：', error);
            return Promise.reject(error);
        }
    }

    // PUT /api/school/drafts/{id} — 自動儲存草稿（欄位皆可省略）
    async updateDraft(id, payload = {}) {
        if (!id) return Promise.reject(new Error('Draft id is required'));
        try {
            const response = await this.http.put(`/api/school/drafts/${encodeURIComponent(id)}`, payload);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('自動儲存草稿失敗：', error);
            return Promise.reject(error);
        }
    }

    // POST /api/school/upload — 封面/內文圖片上傳（公開物件；文章內文只允許
    // 嵌入本站 Firebase Storage 圖片，不可貼外部圖片網址）
    async uploadSchoolImage(file) {
        if (!file) return Promise.reject(new Error('請選擇圖片'));
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await this.http.post('/api/school/upload', formData);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('圖片上傳失敗：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '圖片上傳失敗，請稍後再試');
        }
    }

    // ── Account snapshot (帳號資料，含已核准頭銜與驗證狀態) ─────────

    // GET /api/account/me — richer stage-2 account snapshot, including the
    // caller's own approved achievement titles (with `enabled` flags) and
    // verification timestamps. Distinct from BackendService.getMe(), which
    // targets the pre-existing commodity-marketplace profile shape.
    async getAccountMe() {
        try {
            const response = await this.http.get('/api/account/me');
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得帳號資料失敗：', error);
            return Promise.reject(error);
        }
    }

    // ── Follow / unfollow authors ────────────────────────────────────

    // POST /api/school/follow/{accountId}
    async followAuthor(accountId) {
        if (!accountId) return Promise.reject(new Error('Account id is required'));
        try {
            const response = await this.http.post(`/api/school/follow/${encodeURIComponent(accountId)}`);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('追蹤作者失敗：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '追蹤失敗，請稍後再試');
        }
    }

    // DELETE /api/school/follow/{accountId}
    async unfollowAuthor(accountId) {
        if (!accountId) return Promise.reject(new Error('Account id is required'));
        try {
            const response = await this.http.delete(`/api/school/follow/${encodeURIComponent(accountId)}`);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取消追蹤失敗：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '取消追蹤失敗，請稍後再試');
        }
    }

    // GET /api/school/{accountId}/profile — public author profile
    async getAuthorProfile(accountId) {
        if (!accountId) return Promise.reject(new Error('Account id is required'));
        try {
            const response = await this.http.get(`/api/school/${encodeURIComponent(accountId)}/profile`);
            return response.data;
        } catch (error) {
            console.error('取得作者主頁失敗：', error);
            return Promise.reject(error);
        }
    }

    // ── Profile side-panes (個人檔案頁：我的攻略／已購買／收藏／數據分析／設定) ──

    // GET /api/school/me/articles — my own articles (any status)
    async getMyArticles({ page = 1, limit = 20, status } = {}) {
        try {
            const params = { page, limit };
            if (status) params.status = status;
            const response = await this.http.get('/api/school/me/articles', { params });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得我的攻略失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/school/me/purchases — articles I've bought
    async getMyPurchases({ page = 1, limit = 20 } = {}) {
        try {
            const response = await this.http.get('/api/school/me/purchases', { params: { page, limit } });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得已購買清單失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/school/me/bookmarks — articles I've bookmarked
    async getMyBookmarks({ page = 1, limit = 20 } = {}) {
        try {
            const response = await this.http.get('/api/school/me/bookmarks', { params: { page, limit } });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得收藏清單失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/school/me/analytics — creator trend data (viewTrend/likeTrend/
    // bookmarkTrend/revenueTrend/totalRevenue). NOTE: no per-article breakdown
    // and no reader-source breakdown exist in this response (see memory:
    // school_api_doc_gaps.md #2/#6) — callers must not fabricate those.
    async getMyAnalytics() {
        try {
            const response = await this.http.get('/api/school/me/analytics');
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得創作者數據失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/school/me/settings — my display/watermark preferences
    async getMySettings() {
        try {
            const response = await this.http.get('/api/school/me/settings');
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得偏好設定失敗：', error);
            return Promise.reject(error);
        }
    }

    // PUT /api/school/me/settings
    async updateMySettings({ watermarkPreference, displayNameMode, nameRevealIndex } = {}) {
        try {
            const payload = {};
            if (watermarkPreference != null) payload.watermarkPreference = !!watermarkPreference;
            if (displayNameMode != null) payload.displayNameMode = displayNameMode;
            if (nameRevealIndex != null) payload.nameRevealIndex = nameRevealIndex;
            const response = await this.http.put('/api/school/me/settings', payload);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('更新偏好設定失敗：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '更新失敗，請稍後再試');
        }
    }

    // GET /api/school/me/certifications — aggregated status of my identity
    // verification + education records + achievements (incl. PENDING/REJECTED,
    // unlike /api/account/me which only exposes already-approved titles).
    async getMyCertifications() {
        try {
            const response = await this.http.get('/api/school/me/certifications');
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('取得審核狀態失敗：', error);
            return Promise.reject(error);
        }
    }

    // ── Admin (後台審核) ─────────────────────────────────────────────
    // No back-office page in this repo wires these up yet (there is no
    // admin UI for school identity/education/achievement review at the
    // time of writing). Methods are implemented against the spec so the
    // future back-office page only needs to call them, not re-derive the
    // request/response shapes.

    // GET /api/admin/identity-verifications
    async adminGetIdentityVerifications({ page = 1, limit = 20, status } = {}) {
        try {
            const params = { page, limit };
            if (status) params.status = status;
            const response = await this.http.get('/api/admin/identity-verifications', { params });
            return response.data;
        } catch (error) {
            console.error('取得學生證審核列表失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/admin/identity-verifications/{id} — 列表不含 proofUrl，只有這個
    // detail 端點會回簽過名的 proofUrl（10 分鐘內有效），要查看證明文件時才現抓
    async adminGetIdentityVerificationDetail(id) {
        if (!id) return Promise.reject(new Error('Verification id is required'));
        try {
            const response = await this.http.get(`/api/admin/identity-verifications/${encodeURIComponent(id)}`);
            return response.data;
        } catch (error) {
            console.error('取得學生證審核詳情失敗：', error);
            return Promise.reject(error);
        }
    }

    // PATCH /api/admin/identity-verifications/{id}
    async adminReviewIdentityVerification(id, { status, rejectReason } = {}) {
        if (!id) return Promise.reject(new Error('Verification id is required'));
        try {
            const payload = { status };
            if (rejectReason) payload.rejectReason = rejectReason;
            const response = await this.http.patch(
                `/api/admin/identity-verifications/${encodeURIComponent(id)}`,
                payload
            );
            return response.data;
        } catch (error) {
            console.error('審核學生證失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/admin/education-records
    async adminGetEducationRecords({ page = 1, limit = 20, status } = {}) {
        try {
            const params = { page, limit };
            if (status) params.status = status;
            const response = await this.http.get('/api/admin/education-records', { params });
            return response.data;
        } catch (error) {
            console.error('取得學習經歷申請列表失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/admin/education-records/{id} — 同上，列表不含 proofUrl，查看證明文件要現抓 detail
    async adminGetEducationRecordDetail(id) {
        if (!id) return Promise.reject(new Error('Education record id is required'));
        try {
            const response = await this.http.get(`/api/admin/education-records/${encodeURIComponent(id)}`);
            return response.data;
        } catch (error) {
            console.error('取得學籍異動申請詳情失敗：', error);
            return Promise.reject(error);
        }
    }

    // PATCH /api/admin/education-records/{id}
    async adminReviewEducationRecord(id, { status, rejectReason } = {}) {
        if (!id) return Promise.reject(new Error('Education record id is required'));
        try {
            const payload = { status };
            if (rejectReason) payload.rejectReason = rejectReason;
            const response = await this.http.patch(
                `/api/admin/education-records/${encodeURIComponent(id)}`,
                payload
            );
            return response.data;
        } catch (error) {
            console.error('審核學習經歷申請失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/admin/achievements
    async adminGetAchievements({ page = 1, limit = 20, status } = {}) {
        try {
            const params = { page, limit };
            if (status) params.status = status;
            const response = await this.http.get('/api/admin/achievements', { params });
            return response.data;
        } catch (error) {
            console.error('取得頭銜申請列表失敗：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/admin/achievements/{id} — 同上，列表不含 proofUrl，查看證明文件要現抓 detail
    async adminGetAchievementDetail(id) {
        if (!id) return Promise.reject(new Error('Achievement id is required'));
        try {
            const response = await this.http.get(`/api/admin/achievements/${encodeURIComponent(id)}`);
            return response.data;
        } catch (error) {
            console.error('取得頭銜申請詳情失敗：', error);
            return Promise.reject(error);
        }
    }

    // PATCH /api/admin/achievements/{id}
    async adminReviewAchievement(id, { status, rejectReason } = {}) {
        if (!id) return Promise.reject(new Error('Achievement id is required'));
        try {
            const payload = { status };
            if (rejectReason) payload.rejectReason = rejectReason;
            const response = await this.http.patch(
                `/api/admin/achievements/${encodeURIComponent(id)}`,
                payload
            );
            return response.data;
        } catch (error) {
            console.error('審核頭銜申請失敗：', error);
            return Promise.reject(error);
        }
    }

    // ── Admin 文章審核佇列 ───────────────────────────────────────
    // 矛盾未解：Admin 端點（下面兩個）暗示文章要先進 PENDING 審核佇列才能發佈，
    // 但 School 標籤自己的文件寫 POST /api/school/articles/{id}/submit
    // 「一律直接 PUBLISHED，不經審核」。沒去跟後端求證，先照 Admin 端點實作；
    // 如果這個佇列一直是空的，不是前端串錯，是兩邊文件本來就互相矛盾。

    // GET /api/admin/articles
    async adminGetArticles({ page = 1, limit = 20, status = 'PENDING' } = {}) {
        try {
            const params = { page, limit };
            if (status) params.status = status;
            const response = await this.http.get('/api/admin/articles', { params });
            return response.data;
        } catch (error) {
            console.error('取得文章審核列表失敗：', error);
            return Promise.reject(error);
        }
    }

    // PATCH /api/admin/articles/{id}
    async adminReviewArticle(id, { status, rejectReason } = {}) {
        if (!id) return Promise.reject(new Error('Article id is required'));
        try {
            const payload = { status };
            if (rejectReason) payload.rejectReason = rejectReason;
            const response = await this.http.patch(
                `/api/admin/articles/${encodeURIComponent(id)}`,
                payload
            );
            return response.data;
        } catch (error) {
            console.error('審核文章失敗：', error);
            return Promise.reject(error);
        }
    }

    async getFeature() {
        try {
            const response = await this.http.get('/api/school/featured');
            return response.data;
        } catch (error) {
            console.error('讀取失敗 ：', error);
            return Promise.reject(error);
        }
    }

    // GET /api/school/articles — 文章列表（首頁、搜尋頁共用）
    async getArticles({ category, q, tag, sort, year, type, schoolOnly, page = 1, limit = 20 } = {}) {
        try {
            const params = { page, limit };
            if (category) params.category = category;
            if (q) params.q = q;
            if (tag) params.tag = tag;
            if (sort) params.sort = sort;
            if (year) params.year = year;
            if (type) params.type = type;
            if (schoolOnly != null) params.schoolOnly = schoolOnly;
            const response = await this.http.get('/api/school/articles', { params });
            return response.data;
        } catch (error) {
            console.error('取得文章列表失敗：', error);
            return Promise.reject(error);
        }
    }
}
