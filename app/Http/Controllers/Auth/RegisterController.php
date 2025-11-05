<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Inertia\Response;

class RegisterController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|string|same:password',
            'type' => 'required|string|in:user,partner',
            'address' => 'nullable|string|max:500',
            'terms_accepted' => 'required|boolean|accepted',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'address' => $request->address,
        ]);

        // Assign role using Spatie Laravel Permission
        $role = ucfirst($request->type); // 'user' -> 'User', 'partner' -> 'Partner'
        if (method_exists($user, 'assignRole')) {
            $user->assignRole($role);
        }

        event(new Registered($user));

        Auth::login($user);

        // Return JSON response for AJAX requests (modal)
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Registration successful.',
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()
                ]
            ]);
        }

        // Redirect based on user role for regular form submissions
        if ($request->type === 'partner') {
            return redirect()->route('home')->with('message', 'Partner registration successful! Welcome to RentAndRoom.');
        }

        return redirect()->route('home')->with('message', 'Registration successful! Welcome to RentAndRoom.');
    }
}
