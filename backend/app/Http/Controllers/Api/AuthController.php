<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
class AuthController extends Controller {
 public function login(Request $request) {
  $data=$request->validate(['email'=>'required|email','password'=>'required|string']);
  $user=User::where('email',$data['email'])->first();
  if(!$user || !Hash::check($data['password'],$user->password)) throw ValidationException::withMessages(['email'=>['The supplied credentials are incorrect.']]);
  return response()->json(['token'=>$user->createToken('tailoring-web')->plainTextToken,'user'=>$user],200);
 }
 public function register(Request $request) {
  $data=$request->validate(['name'=>'required|string|max:255','email'=>'required|email|unique:users,email','password'=>'required|string|min:8']);
  $data['role']='staff'; $user=User::create($data);
  return response()->json(['token'=>$user->createToken('tailoring-web')->plainTextToken,'user'=>$user],201);
 }
 public function logout(Request $request) { $request->user()->currentAccessToken()?->delete(); return response()->noContent(); }
 public function user(Request $request) { return response()->json($request->user()); }
}
