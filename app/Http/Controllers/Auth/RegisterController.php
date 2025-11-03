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
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => 'required|string|max:20',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:User,Partner',
            'agree_user_terms' => 'required_if:role,User|boolean',
            'agree_partner_terms' => 'required_if:role,Partner|boolean',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        // Assign role using Spatie Laravel Permission if available
        if (method_exists($user, 'assignRole')) {
            $user->assignRole($request->role);
        }

        event(new Registered($user));

        Auth::login($user);

        // Redirect based on user role
        if ($request->role === 'Partner') {
            return redirect()->route('dashboard')->with('message', 'Partner registration successful! Welcome to RentAndRoom.');
        }

        return redirect()->route('dashboard')->with('message', 'Registration successful! Welcome to RentAndRoom.');
    }
}
