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
    async submitIdentityVerification({ realName, schoolName, proof } = {}) {
        try {
            if (!realName?.trim()) throw new Error('請輸入真實姓名');
            this._validateProofFile(proof);

            const formData = new FormData();
            formData.append('realName', realName.trim());
            if (schoolName?.trim()) formData.append('schoolName', schoolName.trim());
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
}
