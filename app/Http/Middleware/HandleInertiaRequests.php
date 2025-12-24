<?php

namespace App\Http\Middleware;

use App\Models\Message;
use App\Models\PartnerTermsCondition;
use App\Models\PrivacyPolicy;
use App\Models\TermsAndPrivacy;
use App\Models\TermsCondition;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();

        // Prepare user data with Spatie role
        $userData = null;
        $unreadMessagesCount = 0;
        $unreadNotificationsCount = 0;

        if ($user) {
            $userData = array_merge($user->toArray(), [
                'role_name' => $user->roles->first()?->name ?? null,
                'email_verified_at' => $user->email_verified_at,
            ]);

            // Get unread messages count
            $unreadMessagesCount = Message::where('recipient_id', $user->id)
                ->where('is_read', false)
                ->count();

            // Get unread notifications count (recent messages from admin in last 7 days)
            $unreadNotificationsCount = Message::where('recipient_id', $user->id)
                ->where('is_read', false)
                ->where('created_at', '>=', now()->subDays(7))
                ->whereHas('sender', function($query) {
                    $query->whereHas('roles', function($q) {
                        $q->whereIn('name', ['Super Admin', 'Admin']);
                    });
                })
                ->count();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $userData,
            ],
            'unreadMessagesCount' => $unreadMessagesCount,
            'unreadNotificationsCount' => $unreadNotificationsCount,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'partnerTermsConditions' => PartnerTermsCondition::orderBy('id', 'asc')->get(),
            'termsAndPrivacy' => TermsAndPrivacy::orderBy('id', 'asc')->get(),
            'termsConditions' => TermsCondition::orderBy('id', 'asc')->get(),
            'privacyPolicies' => PrivacyPolicy::orderBy('id', 'asc')->get(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }
}
